import { afterEach, describe, expect, test } from 'bun:test';
import {
  Client,
  type FetchLike,
  StreamableHTTPClientTransport,
} from '@modelcontextprotocol/client';
import type { AuthInfo, OAuthTokenVerifier } from '@modelcontextprotocol/server';
import { type AppConfig, parseConfig } from '../src/config/env.js';
import { buildHttpApp, type HttpRuntime } from '../src/http/app.js';
import type { ProviderFetch } from '../src/shared/tools/types.js';

const activeClients = new Set<Client>();
const activeRuntimes = new Set<HttpRuntime>();

afterEach(async () => {
  await Promise.all([...activeClients].map((client) => client.close()));
  await Promise.all([...activeRuntimes].map((runtime) => runtime.close()));
  activeClients.clear();
  activeRuntimes.clear();
});

function testConfig(overrides: Record<string, unknown> = {}): AppConfig {
  return parseConfig({
    NODE_ENV: 'test',
    MCP_PUBLIC_URL: 'http://localhost:3000/mcp',
    MCP_ALLOWED_HOSTS: 'localhost',
    MCP_ALLOWED_ORIGIN_HOSTNAMES: 'localhost',
    AUTH_STRATEGY: 'none',
    RESEND_API_KEY: 'resend-provider-key',
    RESEND_DEFAULT_FROM: 'sender@example.com',
    ...overrides,
  });
}

function createProviderMock() {
  const requests: Array<{ method: string; url: string; authorization: string | null }> =
    [];
  const providerFetch: ProviderFetch = async (input, init) => {
    const url = String(input);
    requests.push({
      method: init?.method ?? 'GET',
      url,
      authorization: new Headers(init?.headers).get('Authorization'),
    });
    if (url.endsWith('/emails') && init?.method === 'POST') {
      return Response.json({ id: `email-${requests.length}` });
    }
    if (url.includes('/contacts/')) {
      const email = decodeURIComponent(url.split('/contacts/')[1]?.split('?')[0] ?? '');
      return Response.json({
        id: 'contact-1',
        email,
        first_name: 'Ada',
        last_name: 'Lovelace',
        unsubscribed: false,
        created_at: '2026-07-27T00:00:00Z',
      });
    }
    if (url.endsWith('/contacts')) {
      return Response.json({ object: 'list', has_more: false, data: [] });
    }
    return Response.json({ object: 'list', has_more: false, data: [] });
  };
  return { providerFetch, requests };
}

function createRuntime(
  config: AppConfig,
  providerFetch: ProviderFetch,
  verifier?: OAuthTokenVerifier,
): HttpRuntime {
  const runtime = buildHttpApp(config, {
    providerFetch,
    ...(verifier ? { verifier } : {}),
  });
  activeRuntimes.add(runtime);
  return runtime;
}

function runtimeFetch(runtime: HttpRuntime, token?: string): FetchLike {
  return async (url, init) => {
    const headers = new Headers(init?.headers);
    headers.set('Host', 'localhost:3000');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return runtime.fetch(new Request(url, { ...init, headers }));
  };
}

async function connect(
  runtime: HttpRuntime,
  era: 'modern' | 'legacy',
  token?: string,
): Promise<Client> {
  const client = new Client(
    { name: `resend-test-${era}`, version: '1.0.0' },
    era === 'modern'
      ? { versionNegotiation: { mode: { pin: '2026-07-28' } } }
      : undefined,
  );
  await client.connect(
    new StreamableHTTPClientTransport(new URL('http://localhost:3000/mcp'), {
      fetch: runtimeFetch(runtime, token),
      ...(token ? { authProvider: { token: async () => token } } : {}),
    }),
  );
  activeClients.add(client);
  return client;
}

const TOOL_NAMES = [
  'upsert_contacts',
  'remove_contacts',
  'find_contacts',
  'segments',
  'send',
  'campaigns',
  'subscriptions',
  'templates',
];

describe('Resend MCP v2 protocol', () => {
  test('modern client discovers every tool and sends through the mocked provider', async () => {
    const mock = createProviderMock();
    const runtime = createRuntime(
      testConfig({
        MCP_AUTH_MODE: 'static-bearer',
        MCP_BEARER_TOKEN: 'mcp-access-token',
      }),
      mock.providerFetch,
    );
    const client = await connect(runtime, 'modern', 'mcp-access-token');

    expect(client.getProtocolEra()).toBe('modern');
    expect(client.getNegotiatedProtocolVersion()).toBe('2026-07-28');
    expect(client.getServerCapabilities()).toEqual({
      tools: { listChanged: true },
    });

    const tools = await client.listTools();
    expect(tools.tools.map((tool) => tool.name)).toEqual(TOOL_NAMES);
    expect(tools.tools.every((tool) => tool.inputSchema.type === 'object')).toBe(true);
    expect(tools.tools.every((tool) => tool.outputSchema?.type === 'object')).toBe(
      true,
    );

    const result = await client.callTool({
      name: 'send',
      arguments: {
        to: 'recipient@example.com',
        subject: 'Migration check',
        body: 'Hello from MCP v2',
      },
    });
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({
      to: ['recipient@example.com'],
      subject: 'Migration check',
      status: 'sent',
    });
    expect(mock.requests).toHaveLength(1);
    expect(mock.requests[0]).toMatchObject({
      method: 'POST',
      authorization: 'Bearer resend-provider-key',
    });
    expect(mock.requests[0]?.authorization).not.toContain('mcp-access-token');
  });

  test('legacy client uses stateless fallback and preserves contact behavior', async () => {
    const mock = createProviderMock();
    const runtime = createRuntime(testConfig(), mock.providerFetch);
    const client = await connect(runtime, 'legacy');

    expect(client.getProtocolEra()).toBe('legacy');
    expect(client.getNegotiatedProtocolVersion()).toBe('2025-11-25');
    expect(client.getServerCapabilities()?.tools?.listChanged).toBe(false);
    expect((await client.listTools()).tools.map((tool) => tool.name)).toEqual(
      TOOL_NAMES,
    );

    const result = await client.callTool({
      name: 'find_contacts',
      arguments: { email: 'ada@example.com' },
    });
    expect(result.structuredContent).toMatchObject({
      items: [{ email: 'ada@example.com', first_name: 'Ada' }],
      has_more: false,
    });
  });

  test('isolates OAuth MCP principals and never forwards their tokens to Resend', async () => {
    const mock = createProviderMock();
    const config = testConfig({
      MCP_AUTH_MODE: 'oauth',
      OAUTH_ISSUER_URL: 'http://auth.example',
      OAUTH_AUTHORIZATION_URL: 'http://auth.example/authorize',
      OAUTH_TOKEN_URL: 'http://auth.example/token',
      OAUTH_JWKS_URL: 'http://auth.example/jwks',
      OAUTH_AUDIENCE: 'http://localhost:3000/mcp',
      OAUTH_REQUIRED_SCOPES: 'mcp:resend',
    });
    const verified: string[] = [];
    const verifier: OAuthTokenVerifier = {
      async verifyAccessToken(token): Promise<AuthInfo> {
        verified.push(token);
        return {
          token,
          clientId: token,
          scopes: ['mcp:resend'],
          expiresAt: Math.floor(Date.now() / 1_000) + 300,
          resource: new URL('http://localhost:3000/mcp'),
        };
      },
    };
    const runtime = createRuntime(config, mock.providerFetch, verifier);

    const [alice, bob] = await Promise.all([
      connect(runtime, 'modern', 'alice-mcp-token'),
      connect(runtime, 'modern', 'bob-mcp-token'),
    ]);
    await Promise.all([
      alice.callTool({
        name: 'send',
        arguments: { to: 'alice@example.com', subject: 'A', body: 'A' },
      }),
      bob.callTool({
        name: 'send',
        arguments: { to: 'bob@example.com', subject: 'B', body: 'B' },
      }),
    ]);

    expect(new Set(verified)).toEqual(new Set(['alice-mcp-token', 'bob-mcp-token']));
    expect(mock.requests).toHaveLength(2);
    expect(
      mock.requests.every(
        (request) => request.authorization === 'Bearer resend-provider-key',
      ),
    ).toBe(true);
  });
});

describe('Resend MCP HTTP boundary', () => {
  test('enforces methods, Host, Origin, CORS, and body limits', async () => {
    const mock = createProviderMock();
    const runtime = createRuntime(
      testConfig({ MCP_MAX_REQUEST_BYTES: '1024' }),
      mock.providerFetch,
    );

    for (const method of ['GET', 'DELETE']) {
      const response = await runtime.fetch(
        new Request('http://localhost:3000/mcp', {
          method,
          headers: { Host: 'localhost:3000' },
        }),
      );
      expect(response.status).toBe(405);
      expect(response.headers.has('Mcp-Session-Id')).toBe(false);
    }

    const badHost = await runtime.fetch(
      new Request('http://localhost:3000/health', {
        headers: { Host: 'evil.example' },
      }),
    );
    expect(badHost.status).toBe(403);

    const badOrigin = await runtime.fetch(
      new Request('http://localhost:3000/mcp', {
        method: 'POST',
        headers: {
          Host: 'localhost:3000',
          Origin: 'https://evil.example',
          'Content-Type': 'application/json',
        },
        body: '{}',
      }),
    );
    expect(badOrigin.status).toBe(403);
    expect(badOrigin.headers.has('Access-Control-Allow-Origin')).toBe(false);

    const preflight = await runtime.fetch(
      new Request('http://localhost:3000/mcp', {
        method: 'OPTIONS',
        headers: {
          Host: 'localhost:3000',
          Origin: 'http://localhost:8080',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'authorization, content-type',
        },
      }),
    );
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('Access-Control-Allow-Origin')).toBe(
      'http://localhost:8080',
    );

    const oversized = await runtime.fetch(
      new Request('http://localhost:3000/mcp', {
        method: 'POST',
        headers: { Host: 'localhost:3000', 'Content-Type': 'application/json' },
        body: 'x'.repeat(1_025),
      }),
    );
    expect(oversized.status).toBe(413);
  });

  test('leaves legacy rejection and modern header errors to the SDK', async () => {
    const mock = createProviderMock();
    const rejecting = createRuntime(
      testConfig({ MCP_LEGACY_MODE: 'reject' }),
      mock.providerFetch,
    );
    const legacy = await rejecting.fetch(
      new Request('http://localhost:3000/mcp', {
        method: 'POST',
        headers: {
          Host: 'localhost:3000',
          Accept: 'application/json, text/event-stream',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2025-11-25',
            capabilities: {},
            clientInfo: { name: 'legacy-test', version: '1.0.0' },
          },
        }),
      }),
    );
    expect(legacy.status).toBe(400);
    expect(await legacy.json()).toMatchObject({ error: { code: -32022 } });

    const modern = createRuntime(testConfig(), mock.providerFetch);
    const mismatch = await modern.fetch(
      new Request('http://localhost:3000/mcp', {
        method: 'POST',
        headers: {
          Host: 'localhost:3000',
          Accept: 'application/json, text/event-stream',
          'Content-Type': 'application/json',
          'MCP-Protocol-Version': '2026-07-28',
          'Mcp-Method': 'tools/list',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'server/discover',
          params: {
            _meta: {
              'io.modelcontextprotocol/protocolVersion': '2026-07-28',
              'io.modelcontextprotocol/clientCapabilities': {},
              'io.modelcontextprotocol/clientInfo': {
                name: 'raw-test',
                version: '1.0.0',
              },
            },
          },
        }),
      }),
    );
    expect(mismatch.status).toBe(400);
    expect(await mismatch.json()).toMatchObject({ error: { code: -32020 } });
  });
});
