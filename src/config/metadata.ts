/**
 * Centralized tool metadata for the Resend MCP server.
 */

export interface ToolMetadata {
  name: string;
  title: string;
  description: string;
}

export const serverMetadata = {
  title: 'Resend',
  instructions: `Use these tools to manage email contacts, segments, and send emails/campaigns via Resend.

Quick start
- Use 'segments' with action='list' first to discover available segments and their IDs.
- Use 'find_contacts' to search for contacts by segment or email.
- Use 'upsert_contacts' to add or update contacts (bulk-capable).
- Use 'send' to send emails to individuals (to) or broadcast to segments (segment).

Contact management
- 'upsert_contacts': Add or update contacts. Accepts array of contacts. Will create if new, update if exists (by email).
- 'remove_contacts': Delete contacts by email. Accepts array of emails.
- 'find_contacts': Search contacts. Filter by segment name or partial email match.

Segment organization
- 'segments': Unified tool for segment operations.
  - action='list': Get all segments with contact counts.
  - action='create': Create new segment by name.
  - action='delete': Delete segment by name.
  - action='add_contacts': Add contacts (emails) to segment.
  - action='remove_contacts': Remove contacts from segment.

Sending emails
- 'send': Unified tool for sending emails.
  - Set 'to' (email or array) for individual emails.
  - Set 'segment' (name) for broadcast to entire segment.
  - Use 'template' + 'variables' to send using a pre-built template.
  - Use 'body' for direct HTML content.
  - Use 'schedule_for' to schedule for later (ISO date or natural language).

Campaign management
- 'campaigns': View and manage sent campaigns.
  - action='list': Get campaign history.
  - action='status': Check status of specific campaign.
  - action='cancel': Cancel scheduled campaign.

Subscriptions
- 'subscriptions': Manage topic opt-in/opt-out.
  - action='subscribe': Opt contact into topic.
  - action='unsubscribe': Opt contact out of topic.
  - action='unsubscribe_all': Unsubscribe from all communications.

Templates
- 'templates': List available email templates with their variables.

Personalization
- In broadcast HTML, use {{{FIRST_NAME}}} or {{{FIRST_NAME|fallback}}} for contact properties.
- Use {{{RESEND_UNSUBSCRIBE_URL}}} for unsubscribe links.

Important
- Resend rate limit is 2 requests/second by default.
- Segments were previously called "Audiences" — use Segments.
- Templates must be published before use.
`,
} as const;

export const toolsMetadata = {
  upsert_contacts: {
    name: 'upsert_contacts',
    title: 'Add/Update Contacts',
    description: `Add or update contacts in the mailing list. Bulk-capable.

Inputs:
- contacts: Array<{email (required), first_name?, last_name?, properties?: Record<string, string|number>}>
- segments?: string[] — Segment names to add all contacts to
- unsubscribed?: boolean — Set subscription status for all contacts

Behavior:
- Creates new contacts if email doesn't exist
- Updates existing contacts if email matches
- Automatically adds to specified segments

Returns: { results: [{email, ok, id?, error?}], summary: {created, updated, failed} }

Next steps: Use 'find_contacts' to verify, or 'segments' to manage membership.`,
  },

  remove_contacts: {
    name: 'remove_contacts',
    title: 'Delete Contacts',
    description: `Delete contacts from the mailing list by email. Bulk-capable.

Inputs:
- emails: string[] — Array of email addresses to remove

Behavior:
- Removes contacts from all segments
- Permanent deletion

Returns: { results: [{email, ok, error?}], summary: {deleted, failed} }`,
  },

  find_contacts: {
    name: 'find_contacts',
    title: 'Search Contacts',
    description: `Search and filter contacts in the mailing list.

Inputs:
- segment?: string — Filter by segment name
- email?: string — Find specific contact by exact email
- unsubscribed?: boolean — Filter by subscription status
- limit?: number — Max results (default 50, max 100)
- cursor?: string — Pagination cursor from previous response

Returns: { items: [{id, email, first_name?, last_name?, unsubscribed, created_at, properties?}], has_more, cursor? }

Next steps: Use returned emails with 'upsert_contacts' to update or 'segments' to modify membership.`,
  },

  segments: {
    name: 'segments',
    title: 'Manage Segments',
    description: `Create, list, delete segments and manage their membership.

Inputs:
- action: 'list' | 'create' | 'delete' | 'add_contacts' | 'remove_contacts' (required)
- name?: string — Segment name (required for create/delete/add_contacts/remove_contacts)
- contacts?: string[] — Array of emails (for add_contacts/remove_contacts)

Actions:
- list: Returns all segments with contact counts
- create: Creates new segment with given name
- delete: Deletes segment (contacts remain in system)
- add_contacts: Adds contacts to segment by email
- remove_contacts: Removes contacts from segment

Returns varies by action:
- list: { items: [{id, name, contact_count, created_at}] }
- create/delete: { id, name, ok }
- add_contacts/remove_contacts: { results: [{email, ok}], summary }

Next steps: Use segment names with 'send' for broadcasts.`,
  },

  send: {
    name: 'send',
    title: 'Send Email',
    description: `Send email to individuals or broadcast to a segment.

Inputs (choose one target):
- to?: string | string[] — Recipient email(s) for individual send (max 50)
- segment?: string — Segment name for broadcast

Content (choose one):
- body?: string — Email content (\\n\\n between paragraphs, \\n between list items)
- template?: string — Template alias/ID (must be published)
- variables?: Record<string, string|number> — Template variables

Common fields:
- subject?: string — Email subject (required unless template provides it)
- name?: string — Broadcast name for dashboard (defaults to subject)
- from_name?: string — Sender display name
- reply_to?: string — Reply-to address
- schedule_for?: string — ISO date or natural language ("in 30 minutes"). Broadcasts default to "in 5 minutes" minimum.

Behavior:
- Individual send (to): Sends immediately or scheduled
- Broadcast (segment): Creates and sends campaign to all contacts in segment
- Templates: Use {{{VAR}}} placeholders, pass values in variables

Returns:
- Individual: { id, to, subject, status }
- Broadcast: { campaign_id, segment, recipients_count, status }

Next steps: Use 'campaigns' to track delivery status.`,
  },

  campaigns: {
    name: 'campaigns',
    title: 'Campaign History',
    description: `View campaign history, check status, or cancel scheduled campaigns.

Inputs:
- action: 'list' | 'status' | 'cancel' (required)
- campaign_id?: string — Required for status/cancel
- limit?: number — For list action (default 20, max 100)
- cursor?: string — Pagination cursor

Actions:
- list: Returns recent campaigns/broadcasts
- status: Get detailed status of specific campaign
- cancel: Cancel a scheduled (not yet sent) campaign

Returns:
- list: { items: [{id, name?, subject, segment_name, status, sent_at?, recipients_count?}], has_more }
- status: { id, status, sent_count?, delivered_count?, opened_count?, failed_count? }
- cancel: { id, cancelled: boolean }

Status values: draft, scheduled, sending, sent, cancelled`,
  },

  subscriptions: {
    name: 'subscriptions',
    title: 'Manage Subscriptions',
    description: `Manage contact opt-in/opt-out preferences for email topics.

Inputs:
- emails: string | string[] — Contact email(s) to update
- action: 'subscribe' | 'unsubscribe' | 'unsubscribe_all' (required)
- topic?: string — Topic name (required for subscribe/unsubscribe, not for unsubscribe_all)

Behavior:
- subscribe: Opts contact into receiving emails for topic
- unsubscribe: Opts contact out of specific topic
- unsubscribe_all: Sets global unsubscribe (no broadcasts)

Returns: { results: [{email, ok, error?}], summary: {success, failed} }

Next steps: Verify with 'find_contacts' to see updated subscription status.`,
  },

  templates: {
    name: 'templates',
    title: 'List Templates',
    description: `List available email templates and their required variables.

Inputs:
- limit?: number — Max results (default 20, max 100)
- cursor?: string — Pagination cursor

Returns: { items: [{id, alias?, name, subject?, from?, variables?: [{key, type, fallback?}], created_at}], has_more }

Notes:
- Only published templates can be used with 'send'
- Use 'alias' or 'id' as the template parameter in 'send'
- Pass variable values in 'send' variables parameter

Next steps: Use template alias with 'send' tool.`,
  },
} as const satisfies Record<string, ToolMetadata>;

/**
 * Type-safe helper to get metadata for a tool.
 */
export function getToolMetadata(toolName: keyof typeof toolsMetadata): ToolMetadata {
  return toolsMetadata[toolName];
}

/**
 * Get all registered tool names.
 */
export function getToolNames(): string[] {
  return Object.keys(toolsMetadata);
}
