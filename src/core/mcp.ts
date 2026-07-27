import {
  type McpRequestContext,
  McpServer,
  type ServerCapabilities,
} from '@modelcontextprotocol/server';
import type { AppConfig } from '../config/env.js';
import { serverImplementation } from '../config/metadata.js';
import { registerTools } from '../shared/tools/registry.js';
import type { ProviderFetch } from '../shared/tools/types.js';

export interface McpServerDependencies {
  providerFetch?: ProviderFetch;
}

function capabilitiesFor(context: McpRequestContext): ServerCapabilities {
  return { tools: { listChanged: context.era === 'modern' } };
}

/** Build a fresh MCP server for one HTTP request. */
export function createMcpServer(
  config: AppConfig,
  context: McpRequestContext,
  dependencies: McpServerDependencies,
): McpServer {
  const server = new McpServer(serverImplementation(config), {
    instructions: config.MCP_INSTRUCTIONS,
    capabilities: capabilitiesFor(context),
    cacheHints: {
      'server/discover': { ttlMs: 60_000, cacheScope: 'private' },
      'tools/list': { ttlMs: 60_000, cacheScope: 'private' },
    },
  });
  registerTools(server, config, dependencies);
  return server;
}
