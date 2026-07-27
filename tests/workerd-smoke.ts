import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

const endpoint = new URL(process.env.MCP_SMOKE_URL ?? 'http://localhost:8787/mcp');
const token = process.env.MCP_SMOKE_TOKEN;
const expected = [
  'upsert_contacts',
  'remove_contacts',
  'find_contacts',
  'segments',
  'send',
  'campaigns',
  'subscriptions',
  'templates',
];

async function discover(era: 'modern' | 'legacy') {
  const client = new Client(
    { name: `workerd-smoke-${era}`, version: '1.0.0' },
    era === 'modern'
      ? { versionNegotiation: { mode: { pin: '2026-07-28' } } }
      : undefined,
  );
  try {
    await client.connect(
      new StreamableHTTPClientTransport(endpoint, {
        ...(token ? { authProvider: { token: async () => token } } : {}),
      }),
    );
    const names = (await client.listTools()).tools.map((tool) => tool.name);
    if (JSON.stringify(names) !== JSON.stringify(expected)) {
      throw new Error(`Unexpected ${era} tools: ${JSON.stringify(names)}`);
    }
    return {
      era: client.getProtocolEra(),
      version: client.getNegotiatedProtocolVersion(),
      tools: names,
    };
  } finally {
    await client.close();
  }
}

console.log(
  JSON.stringify({
    modern: await discover('modern'),
    legacy: await discover('legacy'),
  }),
);
