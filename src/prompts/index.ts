import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

/**
 * Register prompts with the MCP server.
 * Currently no prompts are registered for Resend MCP.
 */
export function registerPrompts(server: McpServer): void {
  // No prompts registered for this server
  logger.info('prompts', {
    message: 'No prompts registered',
  });
}

// Emit listChanged when prompts are updated
export function emitPromptsListChanged(server: McpServer): void {
  server.sendPromptListChanged();
  logger.debug('prompts', {
    message: 'Prompts list changed notification sent',
  });
}
