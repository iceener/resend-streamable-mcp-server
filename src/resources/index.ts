import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { logger } from '../utils/logger.js';

/**
 * Register resources with the MCP server.
 * Currently no resources are registered for Resend MCP.
 */
export function registerResources(server: McpServer): void {
  // No resources registered for this server
  logger.info('resources', {
    message: 'No resources registered',
  });
}

/**
 * Emit resource update notification.
 */
export function emitResourceUpdated(server: McpServer, uri: string): void {
  try {
    (server as any).sendResourceUpdated?.({ uri });
  } catch (error) {
    console.warn('Failed to send resource updated notification:', error);
  }
  logger.debug('resources', {
    message: 'Resource updated notification sent',
    uri,
  });
}

// Emit listChanged when resources are updated
export function emitResourcesListChanged(server: McpServer): void {
  server.sendResourceListChanged();
  logger.debug('resources', {
    message: 'Resources list changed notification sent',
  });
}
