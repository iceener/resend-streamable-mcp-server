// Simplified Auth Strategy for Resend MCP
// Only supports: Bearer Token or None (no OAuth needed)

/**
 * Auth strategy types supported.
 * - 'bearer': Validates incoming Bearer token against BEARER_TOKEN env
 * - 'none': No authentication required
 */
export type AuthStrategyType = 'bearer' | 'none';

/**
 * Resolved auth context.
 */
export interface ResolvedAuth {
  strategy: AuthStrategyType;
  headers: Record<string, string>;
  accessToken?: string;
}

/**
 * Strategy configuration.
 */
export interface AuthStrategyConfig {
  type: AuthStrategyType;
  value?: string;
}

/**
 * Parse auth strategy from env.
 */
export function parseAuthStrategy(env: Record<string, unknown>): AuthStrategyConfig {
  const strategy = (env.AUTH_STRATEGY as string)?.toLowerCase();
  
  if (strategy === 'bearer' || env.BEARER_TOKEN) {
    return {
      type: 'bearer',
      value: env.BEARER_TOKEN as string,
    };
  }

  return { type: 'none' };
}

/**
 * Build auth headers from strategy config.
 */
export function buildAuthHeaders(strategyConfig: AuthStrategyConfig): Record<string, string> {
  if (strategyConfig.type === 'bearer' && strategyConfig.value) {
    return { 'Authorization': `Bearer ${strategyConfig.value}` };
  }
  return {};
}

/**
 * Resolve static auth (for non-OAuth).
 */
export function resolveStaticAuth(strategyConfig: AuthStrategyConfig): ResolvedAuth {
  return {
    strategy: strategyConfig.type,
    headers: buildAuthHeaders(strategyConfig),
    accessToken: strategyConfig.type === 'bearer' ? strategyConfig.value : undefined,
  };
}

/**
 * Check if auth is required.
 */
export function requiresAuth(config: AuthStrategyConfig): boolean {
  return config.type !== 'none';
}

/**
 * Validate auth config.
 */
export function validateAuthConfig(config: AuthStrategyConfig): string[] {
  const errors: string[] = [];

  if (config.type === 'bearer' && !config.value) {
    errors.push('BEARER_TOKEN is required when AUTH_STRATEGY=bearer');
  }

  return errors;
}
