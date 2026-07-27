import {
  createMcpHandler,
  type McpHttpHandler,
  type ServerEventBus,
} from '@modelcontextprotocol/server';
import type { AppConfig } from '../config/env.js';
import type { ProviderFetch } from '../shared/tools/types.js';
import { sharedLogger as logger } from '../shared/utils/logger.js';
import { createMcpServer } from './mcp.js';

export interface RuntimeDependencies {
  eventBus?: ServerEventBus;
  providerFetch?: ProviderFetch;
}

export type McpRuntime = McpHttpHandler;

export function createMcpRuntime(
  config: AppConfig,
  dependencies: RuntimeDependencies,
): McpRuntime {
  return createMcpHandler((context) => createMcpServer(config, context, dependencies), {
    legacy: config.MCP_LEGACY_MODE,
    responseMode: 'auto',
    ...(dependencies.eventBus ? { bus: dependencies.eventBus } : {}),
    onerror(error) {
      logger.error('mcp', { message: 'MCP request failed', error: error.message });
    },
  });
}
