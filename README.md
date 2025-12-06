# Resend MCP Server

Streamable HTTP MCP server for email and newsletter management via [Resend](https://resend.com).

Author: [overment](https://x.com/_overment)

> [!WARNING]
> This server gives an AI agent access to your email sending capabilities. Language models can make mistakes, misinterpret instructions, or send unintended emails. Always:
> - MAKE SURE that the client you use with this MCP requires you to REVIEW and CONFIRM the action before use.
> - Test with a small segment first
> - Broadcasts are always scheduled (minimum 5 minutes ahead) so you can cancel if needed (default is 5 minutes)
> - Set `RESEND_DEFAULT_FROM` to a verified sender address

## Motivation

Traditional email APIs require knowing exact IDs, segment structures, and API quirks. This server is designed so AI agents can:

- **Send newsletters** — broadcast to segments with proper formatting
- **Manage subscribers** — add, update, remove contacts in bulk
- **Use human identifiers** — segment names and emails, not UUIDs
- **Handle formatting** — automatic multipart emails (HTML + plain text)
- **Track campaigns** — view delivery status, cancel scheduled sends

The result: an agent that can reliably manage your newsletter without you touching the Resend dashboard.

## Features

- ✅ **Contacts** — Add, update, remove, search contacts (bulk-capable, up to 100 per call)
- ✅ **Segments** — Create, list, delete segments and manage membership
- ✅ **Send** — Individual emails or broadcast to segments
- ✅ **Campaigns** — View history, check delivery status, cancel scheduled
- ✅ **Templates** — List available templates with variables
- ✅ **Subscriptions** — Topic opt-in/opt-out management
- ✅ **Multipart Emails** — Auto-generates HTML + plain text for best deliverability
- ✅ **Dual Runtime** — Node.js/Bun or Cloudflare Workers

### Design Principles

- **LLM-friendly**: Task-oriented tools, not 1:1 API mirrors
- **Bulk-first**: Contact operations accept arrays by default
- **Human identifiers**: Use emails and segment names, not UUIDs
- **Multipart by default**: Plain text auto-generates HTML for proper rendering
- **Clear feedback**: Results include summaries and next-step suggestions

---

## Server Instructions (What the Model Sees)

```text
Use these tools to manage email contacts, segments, and send emails via Resend.

WORKFLOW:
1. find_contacts or segments(list) → discover existing data
2. upsert_contacts → add/update subscribers
3. send → individual email or broadcast to segment
4. campaigns(status) → track delivery

FORMATTING (for body):
- Use \n\n between paragraphs
- Use \n between list items
- Plain text is auto-converted to multipart (HTML + text) for proper rendering

IMPORTANT:
- Segment names are case-insensitive
- Templates must be published in Resend dashboard to use
- Broadcasts use segment name, not ID
```

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) or Node.js 20+
- [Resend Account](https://resend.com) with verified domain

### 1. Install

```bash
cd resend-mcp
bun install
cp env.example .env
```

### 2. Configure

Get your Resend API key from [resend.com/api-keys](https://resend.com/api-keys).

Edit `.env`:

```env
PORT=3000
AUTH_ENABLED=true
AUTH_STRATEGY=bearer

# Generate with: openssl rand -hex 32
BEARER_TOKEN=your-random-auth-token

# Resend credentials
RESEND_API_KEY=re_your_resend_api_key
RESEND_DEFAULT_FROM=newsletter@yourdomain.com
```

### 3. Run

```bash
bun dev
# MCP: http://127.0.0.1:3000/mcp
```

### 4. Connect Client

**Alice App:**
- URL: `http://127.0.0.1:3000/mcp`
- Type: `streamable-http`
- Header: `Authorization: Bearer <your-BEARER_TOKEN>`

**Claude Desktop / Cursor:**

```json
{
  "mcpServers": {
    "resend": {
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:3000/mcp", "--transport", "http-only"],
      "env": { "NO_PROXY": "127.0.0.1,localhost" }
    }
  }
}
```

---

## Tools

### `upsert_contacts`

Add or update contacts in bulk. Creates if email doesn't exist, updates if it does.

```ts
// Input
{
  contacts: [
    { email: "john@example.com", first_name: "John", last_name: "Doe" },
    { email: "jane@example.com", properties: { plan: "pro", company: "Acme" } }
  ],
  segments?: ["Newsletter", "Premium"],  // Add to these segments
  unsubscribed?: false                   // Set subscription status
}

// Output
{
  results: [{ email, ok, id, action: "created" | "updated", error? }],
  summary: { created: 1, updated: 1, failed: 0 }
}
```

### `remove_contacts`

Permanently delete contacts from your list.

```ts
// Input
{ emails: ["user@example.com", "other@example.com"] }

// Output
{ results: [{ email, ok, error? }], summary: { deleted: 2, failed: 0 } }
```

### `find_contacts`

Search and filter contacts with pagination.

```ts
// Input
{
  segment?: "Newsletter",      // Filter by segment name
  email?: "user@example.com",  // Find specific contact
  unsubscribed?: false,        // Filter by status
  limit?: 50,                  // Max 100
  cursor?: "..."               // From previous response
}

// Output
{
  items: [{ id, email, first_name, last_name, unsubscribed, created_at, properties }],
  has_more: boolean,
  cursor?: string
}
```

### `segments`

Manage segments and their members.

```ts
// List all segments
{ action: "list" }
→ { items: [{ id, name, contact_count, created_at }] }

// Create segment
{ action: "create", name: "VIP Customers" }
→ { id, name, ok: true }

// Delete segment (contacts remain in system)
{ action: "delete", name: "Old Segment" }

// Add contacts to segment
{ action: "add_contacts", name: "Newsletter", contacts: ["a@x.com", "b@x.com"] }

// Remove contacts from segment
{ action: "remove_contacts", name: "Newsletter", contacts: ["a@x.com"] }
```

### `send`

Send individual emails or broadcast to segments.

```ts
// Individual email
{
  to: "user@example.com",        // or array up to 50
  subject: "Welcome!",
  body: "Hello {{{FIRST_NAME}}}!\n\nWelcome to our newsletter.",
  from_name?: "Alice Newsletter",
  reply_to?: "support@example.com",
  schedule_for?: "2024-12-25T10:00:00Z"
}

// Broadcast to segment
{
  segment: "Newsletter",         // Segment name (case-insensitive)
  subject: "Weekly Update",
  name?: "Week 42 Newsletter",   // Dashboard display name
  body: "HEADLINE\n\nFirst paragraph.\n\nSecond paragraph.",
  schedule_for?: "in 2 hours"    // Natural language supported
}

// Using template
{
  to: "user@example.com",
  template: "welcome-email",     // Template alias or ID
  variables: { CTA_TEXT: "Get Started", DISCOUNT: "20%" }
}
```

**Formatting tips:**
- Use `\n\n` between paragraphs
- Use `\n` between list items
- Plain text is auto-converted to HTML with proper line breaks
- Personalization: `{{{FIRST_NAME}}}` or `{{{FIRST_NAME|Friend}}}`

### `campaigns`

View and manage broadcast campaigns.

```ts
// List recent campaigns
{ action: "list", limit?: 20 }
→ { items: [{ id, name, subject, segment_name, status, sent_at, recipients_count }] }

// Get detailed status
{ action: "status", campaign_id: "bc123..." }
→ { id, status, sent_count, delivered_count, opened_count, failed_count }

// Cancel scheduled campaign
{ action: "cancel", campaign_id: "bc123..." }
→ { id, cancelled: true }
```

### `subscriptions`

Manage topic preferences for contacts.

```ts
// Subscribe to topic
{ emails: "user@example.com", action: "subscribe", topic: "Product Updates" }

// Unsubscribe from topic
{ emails: ["a@x.com", "b@x.com"], action: "unsubscribe", topic: "Newsletter" }

// Global unsubscribe (from all emails)
{ emails: "user@example.com", action: "unsubscribe_all" }
```

### `templates`

List available email templates.

```ts
// Input
{ limit?: 50, cursor?: "..." }

// Output
{
  items: [{ id, alias, name, subject, from, variables: [{ key, type, fallback }] }],
  has_more: boolean
}
```

---

## Examples

### 1. Import subscribers and send welcome email

```json
// Add contacts to Newsletter segment
{
  "name": "upsert_contacts",
  "arguments": {
    "contacts": [
      { "email": "alice@example.com", "first_name": "Alice" },
      { "email": "bob@example.com", "first_name": "Bob" }
    ],
    "segments": ["Newsletter"]
  }
}
```

**Response:**
```
Added 2 contact(s). Created: 2, Updated: 0, Failed: 0.
Next: Use 'find_contacts' to verify or 'send' to email them.
```

### 2. Send a broadcast newsletter

```json
{
  "name": "send",
  "arguments": {
    "segment": "Newsletter",
    "subject": "This Week in AI",
    "name": "Week 42 Newsletter",
    "body": "HIGHLIGHTS\n\nClaude 4 was released this week with impressive new capabilities.\n\nKEY FEATURES\n\n• Extended context window\n• Improved reasoning\n• Better code generation\n\nREAD MORE\n\nCheck out the full announcement on our blog."
  }
}
```

**Response:**
```
Broadcast to segment "Newsletter" queued for sending (Campaign ID: abc123).
Use 'campaigns' tool to track delivery.
```

### 3. Check campaign delivery

```json
{
  "name": "campaigns",
  "arguments": { "action": "status", "campaign_id": "abc123" }
}
```

**Response:**
```
Campaign abc123: sent
- Sent: 1,234
- Delivered: 1,198
- Opened: 456 (38%)
- Failed: 36
```

### 4. Unsubscribe a user

```json
{
  "name": "subscriptions",
  "arguments": {
    "emails": "unhappy@example.com",
    "action": "unsubscribe_all"
  }
}
```

**Response:**
```
Updated 1 contact(s). Success: 1, Failed: 0.
```

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Client (Alice App, Claude Desktop)                             │
│      │                                                          │
│      │ Authorization: Bearer <BEARER_TOKEN>                     │
│      ▼                                                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  MCP Server (Node.js / Cloudflare Worker)                   ││
│  │                                                             ││
│  │  1. Validate BEARER_TOKEN (client auth)                     ││
│  │  2. Use RESEND_API_KEY internally                           ││
│  │                                                             ││
│  │  RESEND_API_KEY ──────────► Resend API                      ││
│  │  RESEND_DEFAULT_FROM ─────► (api.resend.com)                ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Key points:**
- `BEARER_TOKEN`: Random token you generate — authenticates MCP clients
- `RESEND_API_KEY`: Your Resend API key — never exposed to clients
- `RESEND_DEFAULT_FROM`: Verified sender address — required

---

## Deployment Options

### Local Development (Node.js/Bun)

```bash
bun dev
# Endpoint: http://127.0.0.1:3000/mcp
```

### Cloudflare Worker (Local Dev)

```bash
# Create .dev.vars with secrets
echo "BEARER_TOKEN=your_token" >> .dev.vars
echo "RESEND_API_KEY=re_xxx" >> .dev.vars
echo "RESEND_DEFAULT_FROM=newsletter@yourdomain.com" >> .dev.vars

bun x wrangler dev --local | cat
# Endpoint: http://127.0.0.1:8787/mcp
```

### Cloudflare Worker (Production)

```bash
# Set secrets
bun x wrangler secret put BEARER_TOKEN
bun x wrangler secret put RESEND_API_KEY
bun x wrangler secret put RESEND_DEFAULT_FROM

# Deploy
bun x wrangler deploy
# Endpoint: https://<worker>.<account>.workers.dev/mcp
```

---

## HTTP Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/mcp` | POST | MCP JSON-RPC 2.0 |
| `/mcp` | GET | SSE stream (for notifications) |
| `/health` | GET | Health check |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | ✓ | Resend API key from resend.com/api-keys |
| `RESEND_DEFAULT_FROM` | ✓ | Verified sender address (e.g., newsletter@yourdomain.com) |
| `BEARER_TOKEN` | ✓ | Auth token for MCP clients (generate with `openssl rand -hex 32`) |
| `PORT` | | Server port (default: 3000) |
| `HOST` | | Server host (default: 127.0.0.1) |
| `AUTH_ENABLED` | | Enable auth (default: true) |
| `AUTH_STRATEGY` | | Auth strategy (default: bearer) |
| `LOG_LEVEL` | | debug, info, warn, error (default: info) |

---

## Architecture

```
src/
├── index.ts                    # Node.js entry point
├── worker.ts                   # Cloudflare Workers entry point
├── config/
│   ├── env.ts                  # Environment parsing
│   └── metadata.ts             # Server & tool descriptions
├── core/
│   └── mcp.ts                  # McpServer builder
├── shared/
│   └── tools/
│       └── resend/             # Tool definitions
│           ├── upsert-contacts.ts
│           ├── remove-contacts.ts
│           ├── find-contacts.ts
│           ├── segments.ts
│           ├── send.ts
│           ├── campaigns.ts
│           ├── subscriptions.ts
│           └── templates.ts
├── services/
│   └── resend/
│       └── client.ts           # Resend API client
├── schemas/
│   └── outputs.ts              # Zod output schemas
└── http/
    ├── app.ts                  # Hono HTTP app
    └── routes/
        └── mcp.ts              # MCP endpoint handler
```

---

## Development

```bash
bun dev           # Start with hot reload (note: sessions clear on reload)
bun start         # Production mode (stable sessions)
bun run typecheck # TypeScript check
bun run lint      # Lint code
bun run build     # Production build
```

**Testing with MCP Inspector:**

```bash
bunx @modelcontextprotocol/inspector
# Connect to: http://localhost:3000/mcp
# Add header: Authorization: Bearer <your-BEARER_TOKEN>
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check `BEARER_TOKEN` matches in server and client |
| "RESEND_API_KEY not configured" | Set `RESEND_API_KEY` in `.env` or secrets |
| "RESEND_DEFAULT_FROM not configured" | Set `RESEND_DEFAULT_FROM` to a verified sender |
| "Segment not found" | Use `segments(action='list')` to see available segments |
| "Template not found" | Ensure template is published in Resend dashboard |
| No newlines in email | Already fixed — emails are multipart (HTML + text) |
| Stale session after restart | Disconnect and reconnect client (hot reload clears sessions) |
| Rate limit (429) | Resend default is 2 req/s. Wait for `retry-after` header |
| Tools not showing | Reconnect client — session may be stale |

---

## License

MIT
