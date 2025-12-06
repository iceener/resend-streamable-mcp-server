// Simplified security for Resend MCP Workers
// Validates bearer token against BEARER_TOKEN env (no OAuth)

import type { UnifiedConfig } from '../../shared/config/env.js';
import { withCors } from '../../shared/http/cors.js';
import {
  validateOrigin,
  validateProtocolVersion,
} from '../../shared/mcp/security.js';

/**
 * Check auth and return error response if invalid.
 * Returns null if authorized.
 */
export async function checkAuthAndChallenge(
  request: Request,
  config: UnifiedConfig,
  _sid: string,
): Promise<Response | null> {
  // Validate origin and protocol
  try {
    validateOrigin(request.headers, config.NODE_ENV === 'development');
    validateProtocolVersion(request.headers, config.MCP_PROTOCOL_VERSION);
  } catch (error) {
    const resp = new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32600, message: (error as Error).message },
        id: null,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
    return withCors(resp);
  }

  // Skip auth if disabled
  if (!config.AUTH_ENABLED) {
    return null;
  }

  // Validate bearer token
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    const resp = new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32001, message: 'Authorization required. Send: Authorization: Bearer <token>' },
        id: null,
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
    return withCors(resp);
  }

  const [scheme, token] = authHeader.split(' ', 2);
  const bearer = scheme?.toLowerCase() === 'bearer' ? (token || '').trim() : '';

  if (bearer !== config.BEARER_TOKEN) {
    const resp = new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32001, message: 'Invalid authorization token' },
        id: null,
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
    return withCors(resp);
  }

  return null;
}
