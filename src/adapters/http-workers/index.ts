/**
 * Cloudflare Workers router factory for Resend MCP.
 * Simplified: no OAuth, just bearer token auth.
 */

import { Router } from 'itty-router';
import type { UnifiedConfig } from '../../shared/config/env.js';
import { corsPreflightResponse, withCors } from '../../shared/http/cors.js';
import type { SessionStore, TokenStore } from '../../shared/storage/interface.js';
import { MemorySessionStore, MemoryTokenStore } from '../../shared/storage/memory.js';
import { initializeStorage } from '../../shared/storage/singleton.js';
import { sharedLogger as logger } from '../../shared/utils/logger.js';
import { handleMcpGet, handleMcpRequest } from './mcp.handler.js';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkerEnv {
  /** All env vars */
  [key: string]: unknown;
}

export interface RouterContext {
  tokenStore: TokenStore;
  sessionStore: SessionStore;
  config: UnifiedConfig;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared State (persists across requests within same worker instance)
// ─────────────────────────────────────────────────────────────────────────────

let sharedTokenStore: MemoryTokenStore | null = null;
let sharedSessionStore: MemorySessionStore | null = null;

// ─────────────────────────────────────────────────────────────────────────────
// Storage Initialization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initialize storage for the worker.
 * Uses in-memory storage (Resend MCP doesn't need persistent token storage).
 */
export function initializeWorkerStorage(
  _env: WorkerEnv,
  _config: UnifiedConfig,
): { tokenStore: TokenStore; sessionStore: SessionStore } | null {
  // Initialize shared memory ONCE per worker instance
  if (!sharedTokenStore || !sharedSessionStore) {
    sharedTokenStore = new MemoryTokenStore();
    sharedSessionStore = new MemorySessionStore();
    logger.debug('worker_storage', { message: 'Memory storage initialized' });
  }

  // Register with singleton for shared access
  initializeStorage(sharedTokenStore, sharedSessionStore);

  return { tokenStore: sharedTokenStore, sessionStore: sharedSessionStore };
}

// ─────────────────────────────────────────────────────────────────────────────
// Router Factory
// ─────────────────────────────────────────────────────────────────────────────

const MCP_ENDPOINT_PATH = '/mcp';

/**
 * Create a configured router for the worker.
 */
export function createWorkerRouter(ctx: RouterContext): {
  fetch: (request: Request) => Promise<Response>;
} {
  const router = Router();
  const { tokenStore, sessionStore, config } = ctx;

  // CORS preflight
  router.options('*', () => corsPreflightResponse());

  // MCP endpoints
  router.get(MCP_ENDPOINT_PATH, () => handleMcpGet());

  router.post(MCP_ENDPOINT_PATH, (request: Request) =>
    handleMcpRequest(request, { tokenStore, sessionStore, config }),
  );

  // Health check
  router.get('/health', () =>
    withCors(
      new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  );

  // Catch-all 404
  router.all('*', () => withCors(new Response('Not Found', { status: 404 })));

  return router;
}

/**
 * Shim process.env for shared modules that expect Node.js environment.
 */
export function shimProcessEnv(env: WorkerEnv): void {
  const g = globalThis as unknown as {
    process?: { env?: Record<string, unknown> };
  };
  g.process = g.process || {};
  g.process.env = { ...(g.process.env ?? {}), ...(env as Record<string, unknown>) };
}
