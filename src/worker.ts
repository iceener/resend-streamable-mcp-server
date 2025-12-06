/**
 * Cloudflare Workers entry point for Resend MCP.
 * Simplified: no OAuth, just bearer token auth.
 */

import {
  createWorkerRouter,
  shimProcessEnv,
  initializeWorkerStorage,
  type WorkerEnv,
} from './adapters/http-workers/index.js';
import { parseConfig } from './shared/config/env.js';

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    // Shim process.env for shared modules
    shimProcessEnv(env);

    // Parse config
    const config = parseConfig(env as Record<string, unknown>);

    // Initialize in-memory storage
    const storage = initializeWorkerStorage(env, config)!;

    // Create and invoke router
    const router = createWorkerRouter({
      tokenStore: storage.tokenStore,
      sessionStore: storage.sessionStore,
      config,
    });

    return router.fetch(request);
  },
};
