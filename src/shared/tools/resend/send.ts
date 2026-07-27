/**
 * Send tool - send email to individuals or broadcast to segment.
 */

import * as z from 'zod/v4';
import { toolsMetadata } from '../../../config/metadata.js';
import {
  SendBroadcastOutputSchema,
  SendIndividualOutputSchema,
  SendOutputSchema,
} from '../../../schemas/outputs.js';
import * as resend from '../../../services/resend/client.js';
import { defineTool, type ToolContext, type ToolResult } from '../types.js';

/**
 * Check if content contains HTML tags.
 */
function hasHtmlTags(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

/**
 * Parse schedule time from ISO 8601 or natural language.
 * Returns Date if parseable, null otherwise.
 */
function parseScheduleTime(input: string): Date | null {
  // Try ISO 8601 first
  const isoDate = new Date(input);
  if (!Number.isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Try natural language patterns
  const now = Date.now();
  const lower = input.toLowerCase().trim();

  // "in X minutes/hours/days"
  const inMatch = lower.match(
    /^in\s+(\d+)\s*(min|minute|minutes|hour|hours|day|days)$/,
  );
  if (inMatch) {
    const amount = parseInt(inMatch[1], 10);
    const unit = inMatch[2];
    let ms = 0;
    if (unit.startsWith('min')) ms = amount * 60 * 1000;
    else if (unit.startsWith('hour')) ms = amount * 60 * 60 * 1000;
    else if (unit.startsWith('day')) ms = amount * 24 * 60 * 60 * 1000;
    return new Date(now + ms);
  }

  // Can't parse - let Resend handle it
  return null;
}

/**
 * Check if a recipient email is allowed by the whitelist.
 * Supports exact email matches and domain patterns (e.g., @example.com).
 */
function isRecipientAllowed(email: string, allowedList: string[]): boolean {
  const normalizedEmail = email.toLowerCase();
  const domain = normalizedEmail.split('@')[1];

  return allowedList.some((pattern) => {
    if (pattern.startsWith('@')) {
      // Domain pattern: @example.com matches user@example.com
      return domain === pattern.slice(1);
    }
    // Exact email match
    return normalizedEmail === pattern;
  });
}

/**
 * Validate all recipients against the whitelist.
 * Returns { valid: true } or { valid: false, blocked: string[] }.
 */
function validateRecipients(
  recipients: string[],
  allowedList?: string[],
): { valid: true } | { valid: false; blocked: string[] } {
  if (!allowedList || allowedList.length === 0) {
    return { valid: true }; // No restriction
  }

  const blocked = recipients.filter((email) => !isRecipientAllowed(email, allowedList));

  if (blocked.length > 0) {
    return { valid: false, blocked };
  }

  return { valid: true };
}

/**
 * Convert plain text to minimal HTML preserving newlines.
 */
function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>\n');
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">${escaped}</div>`;
}

/**
 * Process email content based on format preference.
 * Returns { html?, text? } for the email params.
 *
 * Best practice: Send BOTH html and text for multipart emails.
 * - HTML renders nicely in modern clients
 * - Text is used for spam scoring and fallback
 */
function processContent(
  body: string,
  format: 'text' | 'html' | 'auto',
): { html?: string; text?: string } {
  if (format === 'text') {
    // Multipart: plain text primary, but include HTML for proper rendering
    // Gmail and most clients ignore pure text newlines, so we need HTML too
    return {
      text: body,
      html: textToHtml(body),
    };
  }

  if (format === 'html') {
    // Force HTML only
    if (hasHtmlTags(body)) {
      return { html: body };
    }
    return { html: textToHtml(body) };
  }

  // Auto: send both for best compatibility
  if (hasHtmlTags(body)) {
    // Already HTML - strip tags for text version
    const textVersion = body
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return { html: body, text: textVersion };
  }

  // Plain text: send both versions
  return {
    text: body,
    html: textToHtml(body),
  };
}

const AttachmentSchema = z.object({
  content: z
    .string()
    .optional()
    .describe('Base64 encoded content of the file. Use this OR "path", not both.'),
  filename: z
    .string()
    .describe('Name of the attached file (e.g., "report.pdf", "image.png")'),
  path: z
    .string()
    .url()
    .optional()
    .describe(
      'URL where the attachment file is hosted. Better for larger attachments. Use this OR "content", not both.',
    ),
  content_type: z
    .string()
    .optional()
    .describe(
      'MIME type (e.g., "application/pdf", "image/png"). Auto-detected from filename if not provided.',
    ),
  content_id: z
    .string()
    .optional()
    .describe(
      'Content ID for embedding images inline. Reference in HTML as <img src="cid:your-content-id">',
    ),
});

const InputSchema = z.object({
  // Target (one required)
  to: z
    .union([z.string().email(), z.array(z.string().email())])
    .optional()
    .describe(
      'Recipient email(s) for individual send. Single email or array up to 50. Use this OR "segment", not both.',
    ),
  segment: z
    .string()
    .optional()
    .describe(
      'Segment name for broadcast (sends to all contacts in segment). Use this OR "to", not both. Case-insensitive.',
    ),

  // Content (body or template required)
  body: z
    .string()
    .optional()
    .describe(
      'Email content. Formatting: \\n\\n between paragraphs, \\n between list items. Supports personalization: {{{FIRST_NAME}}}. Use this OR "template", not both.',
    ),
  format: z
    .enum(['text', 'html', 'auto'])
    .optional()
    .default('auto')
    .describe(
      'Content format: "text" = plain text (best deliverability), "html" = HTML, "auto" = detect (plain text with newlines stays as text, HTML passes through). Default: auto',
    ),
  template: z
    .string()
    .optional()
    .describe(
      'Template ID or alias to use. Must be a published template. Use this OR "body", not both.',
    ),
  variables: z
    .record(z.string(), z.union([z.string(), z.number()]))
    .optional()
    .describe(
      'Variables to inject into template, e.g. {"CTA_TEXT": "Sign Up", "DISCOUNT": 20}',
    ),

  // Common fields
  subject: z
    .string()
    .optional()
    .describe(
      'Email subject line. Required for broadcast. For templates, overrides template default if provided.',
    ),
  name: z
    .string()
    .optional()
    .describe(
      'Broadcast name for dashboard display (only for segment broadcasts). Defaults to subject if not provided.',
    ),
  from_name: z
    .string()
    .optional()
    .describe(
      'Sender display name, e.g. "Alice Newsletter". Appears as "Alice Newsletter <noreply@...>"',
    ),
  reply_to: z
    .string()
    .email()
    .optional()
    .describe(
      'Reply-to email address. Recipients who reply will send to this address.',
    ),
  schedule_for: z
    .string()
    .optional()
    .describe(
      'Schedule send time. ISO 8601 format (2024-12-25T10:00:00Z) or natural language ("in 30 minutes", "tomorrow at 9am"). Broadcasts require minimum 5 minutes ahead.',
    ),
  attachments: z
    .array(AttachmentSchema)
    .optional()
    .describe(
      'File attachments (max 40MB total after Base64 encoding). Each attachment needs filename and either content (Base64) or path (URL).',
    ),
});

export const sendTool = defineTool({
  name: toolsMetadata.send.name,
  title: toolsMetadata.send.title,
  description: toolsMetadata.send.description,
  inputSchema: InputSchema,
  outputSchema: SendOutputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true,
  },

  handler: async (args, context: ToolContext): Promise<ToolResult> => {
    // Validate target
    if (!args.to && !args.segment) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Provide either "to" (email addresses) for individual send or "segment" (segment name) for broadcast. One is required.',
          },
        ],
        isError: true,
      };
    }

    if (args.to && args.segment) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Cannot use both "to" and "segment". Choose individual send (to) or broadcast (segment).',
          },
        ],
        isError: true,
      };
    }

    // Validate content
    if (!args.body && !args.template) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Provide either "body" (HTML content) or "template" (template ID/alias). One is required.',
          },
        ],
        isError: true,
      };
    }

    if (args.body && args.template) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Cannot use both "body" and "template". Choose one content source.',
          },
        ],
        isError: true,
      };
    }

    // Validate from address is configured
    if (!context.resendDefaultFrom) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: RESEND_DEFAULT_FROM not configured. Set it in environment (e.g., newsletter@yourdomain.com).',
          },
        ],
        isError: true,
      };
    }

    // Build from address
    const fromAddress = args.from_name
      ? `${args.from_name} <${context.resendDefaultFrom}>`
      : context.resendDefaultFrom;

    // Individual email
    if (args.to) {
      const recipients = Array.isArray(args.to) ? args.to : [args.to];

      if (recipients.length > 50) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Maximum 50 recipients per individual send. Use broadcast for larger sends.',
            },
          ],
          isError: true,
        };
      }

      // Validate recipients against whitelist
      const recipientCheck = validateRecipients(
        recipients,
        context.resendAllowedRecipients,
      );
      if (!recipientCheck.valid) {
        const blockedList = recipientCheck.blocked.join(', ');
        return {
          content: [
            {
              type: 'text',
              text: `Error: Recipients not in allowed list: ${blockedList}. Contact administrator to update RESEND_ALLOWED_RECIPIENTS.`,
            },
          ],
          isError: true,
        };
      }

      const emailParams: resend.SendEmailParams = {
        from: fromAddress,
        to: recipients,
        subject: args.subject ?? 'No Subject',
        reply_to: args.reply_to,
        scheduled_at: args.schedule_for,
      };

      // Content
      if (args.template) {
        emailParams.template = {
          id: args.template,
          variables: args.variables,
        };
      } else if (args.body) {
        const content = processContent(args.body, args.format ?? 'auto');
        if (content.html) emailParams.html = content.html;
        if (content.text) emailParams.text = content.text;
      }

      // Attachments
      if (args.attachments && args.attachments.length > 0) {
        emailParams.attachments = args.attachments.map((att) => ({
          filename: att.filename,
          ...(att.content && { content: att.content }),
          ...(att.path && { path: att.path }),
          ...(att.content_type && { content_type: att.content_type }),
          ...(att.content_id && { content_id: att.content_id }),
        }));
      }

      const result = await resend.sendEmail(context, emailParams);

      const structured = SendIndividualOutputSchema.parse({
        id: result.id,
        to: recipients,
        subject: args.subject ?? 'No Subject',
        status: args.schedule_for ? 'scheduled' : 'sent',
        scheduled_at: args.schedule_for,
      });

      const statusText = args.schedule_for
        ? `scheduled for ${args.schedule_for}`
        : 'sent';
      const text = `Email ${statusText} to ${recipients.length} recipient(s) (ID: ${result.id})`;

      return {
        content: [{ type: 'text', text }],
        structuredContent: structured,
      };
    }

    // Broadcast to segment
    if (args.segment) {
      // Find segment by name
      const segments = await resend.listSegments(context);
      const segment = segments.data.find(
        (s) => s.name.toLowerCase() === args.segment?.toLowerCase(),
      );

      if (!segment) {
        return {
          content: [
            {
              type: 'text',
              text: `Segment "${args.segment}" not found. Use 'segments' tool with action="list" to see available segments.`,
            },
          ],
          isError: true,
        };
      }

      if (!args.subject) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: "subject" is required for broadcast. Provide an email subject line.',
            },
          ],
          isError: true,
        };
      }

      // Broadcasts require scheduling at least 5 minutes ahead for safety
      const scheduleTime = args.schedule_for ?? 'in 5 minutes';

      // Parse and validate minimum 5 minutes for broadcasts
      if (args.schedule_for) {
        const scheduledDate = parseScheduleTime(args.schedule_for);
        const minTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

        if (scheduledDate && scheduledDate < minTime) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: Broadcasts must be scheduled at least 5 minutes ahead. This gives you time to cancel if needed. Use schedule_for="in 5 minutes" or later.',
              },
            ],
            isError: true,
          };
        }
      }

      // Create broadcast
      const broadcastParams: resend.CreateBroadcastParams = {
        segment_id: segment.id,
        from: fromAddress,
        subject: args.subject,
        reply_to: args.reply_to,
        name: args.name ?? args.subject, // Custom name or fallback to subject
      };

      if (args.body) {
        const content = processContent(args.body, args.format ?? 'auto');
        if (content.html) broadcastParams.html = content.html;
        if (content.text) broadcastParams.text = content.text;
      }

      const broadcast = await resend.createBroadcast(context, broadcastParams);

      // Send broadcast (always scheduled, minimum 5 minutes)
      await resend.sendBroadcast(context, broadcast.id, scheduleTime);

      const structured = SendBroadcastOutputSchema.parse({
        campaign_id: broadcast.id,
        segment: args.segment,
        subject: args.subject,
        status: 'scheduled',
        scheduled_at: scheduleTime,
      });

      const text = `Broadcast to segment "${args.segment}" scheduled for ${scheduleTime} (Campaign ID: ${broadcast.id}). Use 'campaigns' tool to track or cancel.`;

      return {
        content: [{ type: 'text', text }],
        structuredContent: structured,
      };
    }

    return {
      content: [{ type: 'text', text: 'Invalid configuration.' }],
      isError: true,
    };
  },
});
