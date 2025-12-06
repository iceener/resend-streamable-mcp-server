// Simplified auth header middleware for Resend MCP
// Only supports bearer token auth (no OAuth)

import type { HttpBindings } from '@hono/node-server';
import type { MiddlewareHandler } from 'hono';
import { config } from '../../config/env.js';
import type { AuthStrategyType } from '../../shared/auth/strategy.js';

/**
 * Auth context attached to Hono context.
 */
export interface AuthContext {
  strategy: AuthStrategyType;
  authHeaders: Record<string, string>;
  resolvedHeaders: Record<string, string>;
  providerToken?: string;
}

/**
 * Auth middleware that extracts auth headers.
 * Actual token validation happens in security middleware.
 */
export function createAuthHeaderMiddleware(): MiddlewareHandler<{
  Bindings: HttpBindings;
}> {
  const strategy = config.AUTH_STRATEGY;

  return async (c, next) => {
    const incoming = c.req.raw.headers;
    const forwarded: Record<string, string> = {};

    // Forward standard auth headers
    const accept = new Set(['authorization', 'x-api-key', 'x-auth-token']);
    for (const [k, v] of incoming as unknown as Iterable<[string, string]>) {
      const lower = k.toLowerCase();
      if (accept.has(lower)) {
        forwarded[lower] = v;
      }
    }

    // Initialize auth context
    const authContext: AuthContext = {
      strategy,
      authHeaders: forwarded,
      resolvedHeaders: { ...forwarded },
    };

    // Attach to context
    (c as unknown as { authContext: AuthContext }).authContext = authContext;
    (c as unknown as { authHeaders?: Record<string, string> }).authHeaders =
      authContext.resolvedHeaders;

    await next();
  };
}
