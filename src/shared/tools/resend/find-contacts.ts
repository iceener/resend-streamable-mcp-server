/**
 * Find Contacts tool - search and filter contacts.
 */

import { z } from 'zod';
import { toolsMetadata } from '../../../config/metadata.js';
import { FindContactsOutputSchema } from '../../../schemas/outputs.js';
import * as resend from '../../../services/resend/client.js';
import { defineTool, type ToolContext, type ToolResult } from '../types.js';

const InputSchema = z.object({
  segment: z.string().optional().describe('Filter contacts by segment name (case-insensitive). Only returns contacts in this segment.'),
  email: z.string().optional().describe('Find a specific contact by exact email address. Returns single contact if found.'),
  unsubscribed: z.boolean().optional().describe('Filter by subscription status. true = only unsubscribed, false = only subscribed.'),
  limit: z.number().int().min(1).max(100).optional().describe('Maximum number of contacts to return. Default 50, max 100.'),
  cursor: z.string().optional().describe('Pagination cursor from previous response. Pass to get next page of results.'),
});

export const findContactsTool = defineTool({
  name: toolsMetadata.find_contacts.name,
  title: toolsMetadata.find_contacts.title,
  description: toolsMetadata.find_contacts.description,
  inputSchema: InputSchema,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
  },

  handler: async (args, context: ToolContext): Promise<ToolResult> => {
    // If specific email is provided, get that contact directly
    if (args.email && !args.segment) {
      try {
        const contact = await resend.getContact(context, args.email);
        
        // Filter by unsubscribed if specified
        if (args.unsubscribed !== undefined && contact.unsubscribed !== args.unsubscribed) {
          const structured = FindContactsOutputSchema.parse({
            items: [],
            has_more: false,
          });
          return {
            content: [{ type: 'text', text: 'No contacts found matching criteria.' }],
            structuredContent: structured,
          };
        }

        const structured = FindContactsOutputSchema.parse({
          items: [contact],
          has_more: false,
        });

        return {
          content: [{ type: 'text', text: `Found contact: ${contact.email} (${contact.first_name || ''} ${contact.last_name || ''})`.trim() }],
          structuredContent: structured,
        };
      } catch {
        const structured = FindContactsOutputSchema.parse({
          items: [],
          has_more: false,
        });
        return {
          content: [{ type: 'text', text: 'Contact not found.' }],
          structuredContent: structured,
        };
      }
    }

    // Resolve segment ID from name if provided
    let segmentId: string | undefined;
    if (args.segment) {
      const segmentsResponse = await resend.listSegments(context);
      const segment = segmentsResponse.data.find(
        s => s.name.toLowerCase() === args.segment!.toLowerCase()
      );
      if (!segment) {
        return {
          content: [{ type: 'text', text: `Segment "${args.segment}" not found. Use 'segments' tool with action='list' to see available segments.` }],
          isError: true,
        };
      }
      segmentId = segment.id;
    }

    // List contacts
    const response = await resend.listContacts(context, segmentId, {
      limit: args.limit ?? 50,
      after: args.cursor,
    });

    // Filter by unsubscribed if specified
    let items = response.data;
    if (args.unsubscribed !== undefined) {
      items = items.filter(c => c.unsubscribed === args.unsubscribed);
    }

    const structured = FindContactsOutputSchema.parse({
      items,
      has_more: response.has_more,
      cursor: response.has_more && items.length > 0 ? items[items.length - 1].id : undefined,
    });

    const segmentText = args.segment ? ` in segment "${args.segment}"` : '';
    const text = `Found ${items.length} contacts${segmentText}.${response.has_more ? ' More available with cursor.' : ''}`;

    return {
      content: [{ type: 'text', text }],
      structuredContent: structured,
    };
  },
});
