import {
  type AuthInfo,
  type AuthMetadataOptions,
  buildOAuthProtectedResourceMetadata,
  getOAuthProtectedResourceMetadataUrl,
  type OAuthTokenVerifier,
  requireBearerAuth,
} from '@modelcontextprotocol/server';
import type { AppConfig } from '../config/env.js';
import { createJwtVerifier } from '../shared/auth/jwt-verifier.js';

export interface AuthServices {
  gate: (request: Request) => Promise<AuthInfo | Response>;
  metadata?: AuthMetadataOptions;
}

function unauthorized(): Response {
  return Response.json(
    {
      error: 'invalid_token',
      error_description: 'A valid MCP bearer token is required',
    },
    {
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer error="invalid_token"' },
    },
  );
}

async function constantTimeEqual(provided: string, expected: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const left = new Uint8Array(providedHash);
  const right = new Uint8Array(expectedHash);
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

function createStaticBearerServices(config: AppConfig): AuthServices {
  const expected = config.MCP_BEARER_TOKEN;
  if (!expected) throw new Error('Static bearer auth is missing MCP_BEARER_TOKEN');

  return {
    async gate(request) {
      const authorization = request.headers.get('Authorization');
      const match = authorization?.match(/^Bearer ([^\s]+)$/);
      if (!match || !(await constantTimeEqual(match[1], expected))) {
        return unauthorized();
      }
      return {
        token: match[1],
        clientId: 'static-bearer-client',
        scopes: [],
        expiresAt: Math.floor(Date.now() / 1_000) + 300,
        resource: new URL(config.MCP_PUBLIC_URL),
      };
    },
  };
}

function createOAuthServices(
  config: AppConfig,
  verifier?: OAuthTokenVerifier,
): AuthServices {
  const tokenVerifier = verifier ?? createJwtVerifier(config);
  if (
    !config.OAUTH_ISSUER_URL ||
    !config.OAUTH_AUTHORIZATION_URL ||
    !config.OAUTH_TOKEN_URL
  ) {
    throw new Error('OAuth Resource Server metadata is incomplete');
  }
  const metadata: AuthMetadataOptions = {
    oauthMetadata: {
      issuer: config.OAUTH_ISSUER_URL,
      authorization_endpoint: config.OAUTH_AUTHORIZATION_URL.href,
      token_endpoint: config.OAUTH_TOKEN_URL.href,
      response_types_supported: config.OAUTH_RESPONSE_TYPES_SUPPORTED,
      grant_types_supported: config.OAUTH_GRANT_TYPES_SUPPORTED,
      code_challenge_methods_supported: config.OAUTH_CODE_CHALLENGE_METHODS_SUPPORTED,
      scopes_supported: config.OAUTH_REQUIRED_SCOPES,
      ...(config.OAUTH_REGISTRATION_URL
        ? { registration_endpoint: config.OAUTH_REGISTRATION_URL.href }
        : {}),
    },
    resourceServerUrl: config.MCP_PUBLIC_URL,
    scopesSupported: config.OAUTH_REQUIRED_SCOPES,
    resourceName: config.MCP_TITLE,
    ...(config.MCP_WEBSITE_URL
      ? { serviceDocumentationUrl: config.MCP_WEBSITE_URL }
      : {}),
    dangerouslyAllowInsecureIssuerUrl: config.NODE_ENV !== 'production',
  };
  buildOAuthProtectedResourceMetadata(metadata);
  return {
    metadata,
    gate: requireBearerAuth({
      verifier: tokenVerifier,
      requiredScopes: config.OAUTH_REQUIRED_SCOPES,
      resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(config.MCP_PUBLIC_URL),
    }),
  };
}

export function createAuthServices(
  config: AppConfig,
  verifier?: OAuthTokenVerifier,
): AuthServices | undefined {
  if (config.AUTH_MODE === 'none') return undefined;
  if (config.AUTH_MODE === 'static-bearer') return createStaticBearerServices(config);
  return createOAuthServices(config, verifier);
}
