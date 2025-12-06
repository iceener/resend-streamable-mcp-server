// Simplified config for Resend MCP (no OAuth needed)

export type AuthStrategyType = 'bearer' | 'none';

export type UnifiedConfig = {
  // Server
  HOST: string;
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';

  // MCP
  MCP_TITLE: string;
  MCP_INSTRUCTIONS: string;
  MCP_VERSION: string;
  MCP_PROTOCOL_VERSION: string;

  // Auth (bearer token for client access)
  AUTH_ENABLED: boolean;
  AUTH_STRATEGY: AuthStrategyType;
  BEARER_TOKEN?: string;

  // Resend API
  RESEND_API_KEY?: string;
  RESEND_DEFAULT_FROM?: string;

  // Rate limiting
  RPS_LIMIT: number;
  CONCURRENCY_LIMIT: number;

  // Logging
  LOG_LEVEL: 'debug' | 'info' | 'warning' | 'error';
};

function parseBoolean(value: unknown): boolean {
  return String(value || 'false').toLowerCase() === 'true';
}

function parseNumber(value: unknown, defaultValue: number): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : defaultValue;
}

/**
 * Parse environment variables into a unified config object.
 * Works for both process.env (Node.js) and Workers env bindings.
 */
export function parseConfig(env: Record<string, unknown>): UnifiedConfig {
  const authEnabled = parseBoolean(env.AUTH_ENABLED);
  
  return {
    HOST: String(env.HOST || '127.0.0.1'),
    PORT: parseNumber(env.PORT, 3000),
    NODE_ENV: (env.NODE_ENV as UnifiedConfig['NODE_ENV']) || 'development',

    MCP_TITLE: String(env.MCP_TITLE || 'Resend'),
    MCP_INSTRUCTIONS: String(
      env.MCP_INSTRUCTIONS ||
        'Use these tools to manage email contacts, segments, and send emails via Resend.',
    ),
    MCP_VERSION: String(env.MCP_VERSION || '1.0.0'),
    MCP_PROTOCOL_VERSION: String(env.MCP_PROTOCOL_VERSION || '2025-06-18'),

    // Auth
    AUTH_ENABLED: authEnabled,
    AUTH_STRATEGY: authEnabled ? 'bearer' : 'none',
    BEARER_TOKEN: env.BEARER_TOKEN as string | undefined,

    // Resend
    RESEND_API_KEY: (env.RESEND_API_KEY as string | undefined)?.trim(),
    RESEND_DEFAULT_FROM: env.RESEND_DEFAULT_FROM as string | undefined,

    // Rate limiting
    RPS_LIMIT: parseNumber(env.RPS_LIMIT, 2), // Resend default is 2 req/s
    CONCURRENCY_LIMIT: parseNumber(env.CONCURRENCY_LIMIT, 2),

    LOG_LEVEL: (env.LOG_LEVEL as UnifiedConfig['LOG_LEVEL']) || 'info',
  };
}

export function resolveConfig(): UnifiedConfig {
  return parseConfig(process.env as Record<string, unknown>);
}
