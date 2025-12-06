/**
 * Simplified MCP endpoint handler for Cloudflare Workers.
 * No OAuth - just bearer token auth for client access.
 */

import type { UnifiedConfig } from '../../shared/config/env.js';
import { withCors } from '../../shared/http/cors.js';
import { jsonResponse } from '../../shared/http/response.js';
import {
  dispatchMcpMethod,
  handleMcpNotification,
  type CancellationRegistry,
  type McpDispatchContext,
  type McpSessionState,
} from '../../shared/mcp/dispatcher.js';
import type { SessionStore, TokenStore } from '../../shared/storage/interface.js';
import type { ToolContext } from '../../shared/tools/types.js';
import { checkAuthAndChallenge } from './security.js';

// ─────────────────────────────────────────────────────────────────────────────
// Session State (in-memory, persists within worker instance)
// ─────────────────────────────────────────────────────────────────────────────

const sessionStateMap = new Map<string, McpSessionState>();
const cancellationRegistryMap = new Map<string, CancellationRegistry>();

function getCancellationRegistry(sessionId: string): CancellationRegistry {
  let registry = cancellationRegistryMap.get(sessionId);
  if (!registry) {
    registry = new Map();
    cancellationRegistryMap.set(sessionId, registry);
  }
  return registry;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth Resolution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build tool context (simplified for Resend - no OAuth token mapping).
 */
function buildToolContext(request: Request): ToolContext {
  const rawHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    rawHeaders[key.toLowerCase()] = value;
  });

  return {
    sessionId: '',
    authStrategy: 'bearer',
    providerToken: undefined, // Resend API key comes from env, not context
    provider: undefined,
    resolvedHeaders: rawHeaders,
    authHeaders: rawHeaders,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Request Handler
// ─────────────────────────────────────────────────────────────────────────────

export interface McpHandlerDeps {
  tokenStore: TokenStore;
  sessionStore: SessionStore;
  config: UnifiedConfig;
}

/**
 * Handle MCP POST request.
 */
export async function handleMcpRequest(
  request: Request,
  deps: McpHandlerDeps,
): Promise<Response> {
  const { sessionStore, config } = deps;

  // Get or create session ID
  const incomingSessionId = request.headers.get('Mcp-Session-Id');
  const sessionId = incomingSessionId?.trim() || crypto.randomUUID();

  // Ensure session exists
  try {
    await sessionStore.ensure(sessionId);
  } catch {
    // Ignore session creation errors
  }

  // Check auth
  const challengeResponse = await checkAuthAndChallenge(request, config, sessionId);
  if (challengeResponse) {
    return challengeResponse;
  }

  // Build tool context
  const authContext = buildToolContext(request);
  authContext.sessionId = sessionId;

  // Parse JSON-RPC body
  const body = (await request.json().catch(() => ({}))) as {
    jsonrpc?: string;
    method?: string;
    params?: Record<string, unknown>;
    id?: string | number | null;
  };

  const { method, params, id } = body;

  // Get cancellation registry for this session
  const cancellationRegistry = getCancellationRegistry(sessionId);

  // Build dispatch context
  const dispatchContext: McpDispatchContext = {
    sessionId,
    auth: authContext,
    config: {
      title: config.MCP_TITLE,
      version: config.MCP_VERSION,
      instructions: config.MCP_INSTRUCTIONS,
    },
    getSessionState: () => sessionStateMap.get(sessionId),
    setSessionState: (state) => sessionStateMap.set(sessionId, state),
    cancellationRegistry,
  };

  // Handle notifications (no id) - return 202 Accepted
  if (!('id' in body) || id === null || id === undefined) {
    if (method) {
      handleMcpNotification(method, params, dispatchContext);
    }
    return withCors(new Response(null, { status: 202 }));
  }

  // Dispatch JSON-RPC request
  const result = await dispatchMcpMethod(method, params, dispatchContext, id);

  // Build response
  const response = jsonResponse({
    jsonrpc: '2.0',
    ...(result.error ? { error: result.error } : { result: result.result }),
    id,
  });

  response.headers.set('Mcp-Session-Id', sessionId);
  return withCors(response);
}

/**
 * Handle MCP GET request (returns 405 per spec).
 */
export function handleMcpGet(): Response {
  return withCors(new Response('Method Not Allowed', { status: 405 }));
}
