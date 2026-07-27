export type RuntimeEnvironment = 'development' | 'production' | 'test';
export type LegacyMode = 'stateless' | 'reject';
export type LogLevel = 'debug' | 'info' | 'warning' | 'error';
export type AuthMode = 'none' | 'static-bearer' | 'oauth';

export interface AppConfig {
  HOST: string;
  PORT: number;
  NODE_ENV: RuntimeEnvironment;
  LOG_LEVEL: LogLevel;

  MCP_NAME: string;
  MCP_TITLE: string;
  MCP_VERSION: string;
  MCP_DESCRIPTION: string;
  MCP_INSTRUCTIONS: string;
  MCP_PUBLIC_URL: URL;
  MCP_WEBSITE_URL?: URL;
  MCP_ALLOWED_HOSTS: string[];
  MCP_ALLOWED_ORIGIN_HOSTNAMES: string[];
  MCP_LEGACY_MODE: LegacyMode;
  MCP_MAX_REQUEST_BYTES: number;

  AUTH_MODE: AuthMode;
  MCP_BEARER_TOKEN?: string;
  OAUTH_ISSUER_URL?: string;
  OAUTH_AUTHORIZATION_URL?: URL;
  OAUTH_TOKEN_URL?: URL;
  OAUTH_REGISTRATION_URL?: URL;
  OAUTH_JWKS_URL?: URL;
  OAUTH_AUDIENCE?: string;
  OAUTH_REQUIRED_SCOPES: string[];
  OAUTH_JWT_ALGORITHMS: string[];
  OAUTH_CLIENT_ID_CLAIM: string;
  OAUTH_RESPONSE_TYPES_SUPPORTED: string[];
  OAUTH_GRANT_TYPES_SUPPORTED: string[];
  OAUTH_CODE_CHALLENGE_METHODS_SUPPORTED: string[];

  RESEND_API_KEY?: string;
  RESEND_DEFAULT_FROM?: string;
  RESEND_ALLOWED_RECIPIENTS?: string[];
  RPS_LIMIT: number;
  CONCURRENCY_LIMIT: number;
}

function stringValue(env: Record<string, unknown>, key: string, fallback = ''): string {
  const value = env[key];
  return value === undefined || value === null || value === ''
    ? fallback
    : String(value).trim();
}

function booleanValue(env: Record<string, unknown>, key: string): boolean {
  const value = stringValue(env, key).toLowerCase();
  if (!value || ['0', 'false', 'no', 'off'].includes(value)) return false;
  if (['1', 'true', 'yes', 'on'].includes(value)) return true;
  throw new Error(`${key} must be true or false`);
}

function numberValue(
  env: Record<string, unknown>,
  key: string,
  fallback: number,
  maximum = 65_535,
): number {
  const value = Number(stringValue(env, key, String(fallback)));
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new Error(`${key} must be an integer between 1 and ${maximum}`);
  }
  return value;
}

function requestSizeValue(env: Record<string, unknown>): number {
  const value = numberValue(env, 'MCP_MAX_REQUEST_BYTES', 1_048_576, 10_485_760);
  if (value < 1_024) {
    throw new Error('MCP_MAX_REQUEST_BYTES must be at least 1024');
  }
  return value;
}

function listValue(
  env: Record<string, unknown>,
  key: string,
  fallback: string[] = [],
): string[] {
  const value = stringValue(env, key);
  if (!value) return [...fallback];
  return [
    ...new Set(
      value
        .split(/[ ,]+/)
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  ];
}

function enumValue<T extends string>(
  env: Record<string, unknown>,
  key: string,
  values: readonly T[],
  fallback: T,
): T {
  const value = stringValue(env, key, fallback) as T;
  if (!values.includes(value)) {
    throw new Error(`${key} must be one of: ${values.join(', ')}`);
  }
  return value;
}

function urlValue(
  env: Record<string, unknown>,
  key: string,
  fallback?: string,
): URL | undefined {
  const value = stringValue(env, key, fallback);
  if (!value) return undefined;
  try {
    return new URL(value);
  } catch {
    throw new Error(`${key} must be an absolute URL`);
  }
}

function urlStringValue(env: Record<string, unknown>, key: string): string | undefined {
  const value = stringValue(env, key);
  if (!value) return undefined;
  try {
    new URL(value);
  } catch {
    throw new Error(`${key} must be an absolute URL`);
  }
  return value;
}

function isLoopback(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

function validateSecureUrl(
  url: URL,
  key: string,
  environment: RuntimeEnvironment,
): void {
  if (
    environment === 'production' &&
    url.protocol !== 'https:' &&
    !isLoopback(url.hostname)
  ) {
    throw new Error(`${key} must use HTTPS in production`);
  }
}

function authModeValue(env: Record<string, unknown>): AuthMode {
  const explicit = stringValue(env, 'MCP_AUTH_MODE').toLowerCase();
  if (explicit) {
    return enumValue(
      { MCP_AUTH_MODE: explicit },
      'MCP_AUTH_MODE',
      ['none', 'static-bearer', 'oauth'] as const,
      'none',
    );
  }

  const legacyStrategy = stringValue(env, 'AUTH_STRATEGY').toLowerCase();
  if (legacyStrategy === 'none') return 'none';
  if (legacyStrategy === 'bearer') return 'static-bearer';
  if (legacyStrategy === 'oauth') return 'oauth';

  const staticToken =
    stringValue(env, 'MCP_BEARER_TOKEN') || stringValue(env, 'BEARER_TOKEN');
  if (booleanValue(env, 'AUTH_ENABLED')) {
    return staticToken ? 'static-bearer' : 'oauth';
  }
  return staticToken ? 'static-bearer' : 'none';
}

/** Parse deployment-scoped configuration for Bun or Cloudflare Workers. */
export function parseConfig(env: Record<string, unknown>): AppConfig {
  const port = numberValue(env, 'PORT', 3000);
  const environment = enumValue(
    env,
    'NODE_ENV',
    ['development', 'production', 'test'] as const,
    'development',
  );
  const configuredPublicUrl = stringValue(env, 'MCP_PUBLIC_URL');
  if (environment === 'production' && !configuredPublicUrl) {
    throw new Error('MCP_PUBLIC_URL is required in production');
  }
  const publicUrl = urlValue(
    env,
    'MCP_PUBLIC_URL',
    `http://localhost:${port}/mcp`,
  ) as URL;
  if (publicUrl.search || publicUrl.hash) {
    throw new Error('MCP_PUBLIC_URL must not include a query string or fragment');
  }
  validateSecureUrl(publicUrl, 'MCP_PUBLIC_URL', environment);

  const defaultHosts = [publicUrl.hostname];
  if (environment !== 'production') {
    defaultHosts.push('localhost', '127.0.0.1', '[::1]');
  }

  const authMode = authModeValue(env);
  const staticToken =
    stringValue(env, 'MCP_BEARER_TOKEN') ||
    stringValue(env, 'BEARER_TOKEN') ||
    undefined;
  if (authMode === 'static-bearer' && !staticToken) {
    throw new Error('MCP_BEARER_TOKEN is required for static-bearer auth');
  }

  const issuer = urlStringValue(env, 'OAUTH_ISSUER_URL');
  const authorizationUrl = urlValue(env, 'OAUTH_AUTHORIZATION_URL');
  const tokenUrl = urlValue(env, 'OAUTH_TOKEN_URL');
  const jwksUrl = urlValue(env, 'OAUTH_JWKS_URL');
  const audience = stringValue(env, 'OAUTH_AUDIENCE', publicUrl.href);

  if (authMode === 'oauth') {
    if (!issuer || !authorizationUrl || !tokenUrl || !jwksUrl) {
      throw new Error(
        'OAuth auth requires OAUTH_ISSUER_URL, OAUTH_AUTHORIZATION_URL, OAUTH_TOKEN_URL, and OAUTH_JWKS_URL',
      );
    }
    if (audience !== publicUrl.href) {
      throw new Error('OAUTH_AUDIENCE must exactly match MCP_PUBLIC_URL');
    }
    const oauthUrls: Array<[string, URL]> = [
      ['OAUTH_ISSUER_URL', new URL(issuer)],
      ['OAUTH_AUTHORIZATION_URL', authorizationUrl],
      ['OAUTH_TOKEN_URL', tokenUrl],
      ['OAUTH_JWKS_URL', jwksUrl],
    ];
    const registrationUrl = urlValue(env, 'OAUTH_REGISTRATION_URL');
    if (registrationUrl) oauthUrls.push(['OAUTH_REGISTRATION_URL', registrationUrl]);
    for (const [key, url] of oauthUrls) validateSecureUrl(url, key, environment);
  }

  const allowedHosts = listValue(env, 'MCP_ALLOWED_HOSTS', defaultHosts);
  const allowedOriginHostnames = listValue(
    env,
    'MCP_ALLOWED_ORIGIN_HOSTNAMES',
    defaultHosts,
  );
  if (allowedHosts.length === 0 || allowedOriginHostnames.length === 0) {
    throw new Error('MCP Host and Origin allowlists must not be empty');
  }

  return {
    HOST: stringValue(env, 'HOST', '127.0.0.1'),
    PORT: port,
    NODE_ENV: environment,
    LOG_LEVEL: enumValue(
      env,
      'LOG_LEVEL',
      ['debug', 'info', 'warning', 'error'] as const,
      'info',
    ),
    MCP_NAME: stringValue(env, 'MCP_NAME', 'resend-mcp'),
    MCP_TITLE: stringValue(env, 'MCP_TITLE', 'Resend'),
    MCP_VERSION: stringValue(env, 'MCP_VERSION', '1.0.0'),
    MCP_DESCRIPTION: stringValue(
      env,
      'MCP_DESCRIPTION',
      'Manage contacts, email, campaigns, subscriptions, and templates with Resend.',
    ),
    MCP_INSTRUCTIONS: stringValue(
      env,
      'MCP_INSTRUCTIONS',
      'Use the available tools to manage email contacts, segments, and email delivery via Resend.',
    ),
    MCP_PUBLIC_URL: publicUrl,
    MCP_WEBSITE_URL: urlValue(env, 'MCP_WEBSITE_URL'),
    MCP_ALLOWED_HOSTS: allowedHosts,
    MCP_ALLOWED_ORIGIN_HOSTNAMES: allowedOriginHostnames,
    MCP_LEGACY_MODE: enumValue(
      env,
      'MCP_LEGACY_MODE',
      ['stateless', 'reject'] as const,
      'stateless',
    ),
    MCP_MAX_REQUEST_BYTES: requestSizeValue(env),
    AUTH_MODE: authMode,
    MCP_BEARER_TOKEN: staticToken,
    OAUTH_ISSUER_URL: issuer,
    OAUTH_AUTHORIZATION_URL: authorizationUrl,
    OAUTH_TOKEN_URL: tokenUrl,
    OAUTH_REGISTRATION_URL: urlValue(env, 'OAUTH_REGISTRATION_URL'),
    OAUTH_JWKS_URL: jwksUrl,
    OAUTH_AUDIENCE: audience || undefined,
    OAUTH_REQUIRED_SCOPES: listValue(env, 'OAUTH_REQUIRED_SCOPES'),
    OAUTH_JWT_ALGORITHMS: listValue(env, 'OAUTH_JWT_ALGORITHMS', ['RS256', 'ES256']),
    OAUTH_CLIENT_ID_CLAIM: stringValue(env, 'OAUTH_CLIENT_ID_CLAIM', 'client_id'),
    OAUTH_RESPONSE_TYPES_SUPPORTED: listValue(env, 'OAUTH_RESPONSE_TYPES_SUPPORTED', [
      'code',
    ]),
    OAUTH_GRANT_TYPES_SUPPORTED: listValue(env, 'OAUTH_GRANT_TYPES_SUPPORTED', [
      'authorization_code',
    ]),
    OAUTH_CODE_CHALLENGE_METHODS_SUPPORTED: listValue(
      env,
      'OAUTH_CODE_CHALLENGE_METHODS_SUPPORTED',
      ['S256'],
    ),
    RESEND_API_KEY: stringValue(env, 'RESEND_API_KEY') || undefined,
    RESEND_DEFAULT_FROM: stringValue(env, 'RESEND_DEFAULT_FROM') || undefined,
    RESEND_ALLOWED_RECIPIENTS:
      listValue(env, 'RESEND_ALLOWED_RECIPIENTS').map((value) => value.toLowerCase()) ||
      undefined,
    RPS_LIMIT: numberValue(env, 'RPS_LIMIT', 2, 10_000),
    CONCURRENCY_LIMIT: numberValue(env, 'CONCURRENCY_LIMIT', 2, 1_000),
  };
}
