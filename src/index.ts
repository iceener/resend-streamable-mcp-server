import { serve } from '@hono/node-server';
import { config } from './config/env.js';
import { stopContextCleanup } from './core/context.js';
import { buildHttpApp } from './http/app.js';
import { MemorySessionStore, MemoryTokenStore } from './shared/storage/memory.js';
import { initializeStorage } from './shared/storage/singleton.js';
import { logger } from './utils/logger.js';

// Store references for graceful shutdown
let tokenStore: MemoryTokenStore | null = null;
let sessionStore: MemorySessionStore | null = null;

async function main(): Promise<void> {
  try {
    // Initialize storage (in-memory for Resend MCP - no OAuth token persistence needed)
    tokenStore = new MemoryTokenStore();
    sessionStore = new MemorySessionStore();
    initializeStorage(tokenStore, sessionStore);

    const app = buildHttpApp();
    serve({ fetch: app.fetch, port: config.PORT, hostname: config.HOST });

    await logger.info('server', {
      message: `Resend MCP server started on http://${config.HOST}:${config.PORT}/mcp`,
      environment: config.NODE_ENV,
      authEnabled: config.AUTH_ENABLED,
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    await logger.error('server', {
      message: 'Server startup failed',
      error: (error as Error).message,
    });
    process.exit(1);
  }
}

function gracefulShutdown(signal: string): void {
  void logger.info('server', { message: `Received ${signal}, shutting down` });

  // Stop cleanup intervals
  stopContextCleanup();

  // Stop store cleanup
  if (tokenStore) {
    tokenStore.stopCleanup();
  }
  if (sessionStore) {
    sessionStore.stopCleanup();
  }

  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

void main();
