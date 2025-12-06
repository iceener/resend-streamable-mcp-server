// Simplified security middleware for Resend MCP
// Validates bearer token against BEARER_TOKEN env (no OAuth)

import type { HttpBindings } from '@hono/node-server';
import type { MiddlewareHandler } from 'hono';
import type { UnifiedConfig } from '../../shared/config/env.js';
import {
  validateOrigin,
  validateProtocolVersion,
} from '../../shared/mcp/security.js';
import { sharedLogger as logger } from '../../shared/utils/logger.js';

export function createMcpSecurityMiddleware(config: UnifiedConfig): MiddlewareHandler<{
  Bindings: HttpBindings;
}> {
  return async (c, next) => {
    try {
      // Validate origin and protocol version
      validateOrigin(c.req.raw.headers, config.NODE_ENV === 'development');
      validateProtocolVersion(c.req.raw.headers, config.MCP_PROTOCOL_VERSION);

      // Bearer token auth
      if (config.AUTH_ENABLED && config.BEARER_TOKEN) {
        const auth = c.req.header('Authorization');

        if (!auth) {
          return c.json(
            {
              jsonrpc: '2.0',
              error: {
                code: -32001,
                message: 'Authorization required. Send: Authorization: Bearer <token>',
              },
              id: null,
            },
            401,
          );
        }

        const [scheme, token] = auth.split(' ', 2);
        const bearer = scheme?.toLowerCase() === 'bearer' ? (token || '').trim() : '';

        if (bearer !== config.BEARER_TOKEN) {
          logger.warning('mcp_security', { message: 'Invalid bearer token' });
          return c.json(
            {
              jsonrpc: '2.0',
              error: {
                code: -32001,
                message: 'Invalid authorization token',
              },
              id: null,
            },
            401,
          );
        }

        // Token valid - set auth context for tools
        const authContext = {
          strategy: 'bearer' as const,
          authHeaders: { authorization: auth },
          resolvedHeaders: {},
          providerToken: undefined,
        };
        (c as unknown as { authContext: typeof authContext }).authContext = authContext;
      }

      return next();
    } catch (error) {
      logger.error('mcp_security', {
        message: 'Security check failed',
        error: (error as Error).message,
      });

      return c.json(
        {
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: (error as Error).message || 'Internal server error',
          },
          id: null,
        },
        500,
      );
    }
  };
}
