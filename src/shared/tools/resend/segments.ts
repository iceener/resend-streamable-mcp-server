/**
 * Segments tool - manage segments and membership.
 */

import * as z from 'zod/v4';
import { toolsMetadata } from '../../../config/metadata.js';
import {
  SegmentActionOutputSchema,
  SegmentMembershipOutputSchema,
  SegmentsListOutputSchema,
  SegmentsOutputSchema,
} from '../../../schemas/outputs.js';
import * as resend from '../../../services/resend/client.js';
import { defineTool, type ToolContext, type ToolResult } from '../types.js';

const InputSchema = z.object({
  action: z
    .enum(['list', 'create', 'delete', 'add_contacts', 'remove_contacts'])
    .describe(
      'Action to perform: "list" = get all segments, "create" = create new segment, "delete" = remove segment, "add_contacts" = add emails to segment, "remove_contacts" = remove emails from segment',
    ),
  name: z
    .string()
    .optional()
    .describe(
      'Segment name. Required for create/delete/add_contacts/remove_contacts. Case-insensitive for lookups.',
    ),
  contacts: z
    .array(z.string().email())
    .optional()
    .describe(
      'Array of email addresses. Required for add_contacts/remove_contacts actions. Max 100 emails.',
    ),
});

export const segmentsTool = defineTool({
  name: toolsMetadata.segments.name,
  title: toolsMetadata.segments.title,
  description: toolsMetadata.segments.description,
  inputSchema: InputSchema,
  outputSchema: SegmentsOutputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
  },

  handler: async (args, context: ToolContext): Promise<ToolResult> => {
    switch (args.action) {
      case 'list': {
        const response = await resend.listSegments(context);

        // Get contact counts for each segment (approximate)
        const items = await Promise.all(
          response.data.map(async (segment) => {
            try {
              const contacts = await resend.listContacts(context, segment.id, {
                limit: 1,
              });
              return {
                id: segment.id,
                name: segment.name,
                contact_count: contacts.has_more ? 100 : contacts.data.length,
                created_at: segment.created_at,
              };
            } catch {
              return {
                id: segment.id,
                name: segment.name,
                created_at: segment.created_at,
              };
            }
          }),
        );

        const structured = SegmentsListOutputSchema.parse({
          items,
          has_more: response.has_more,
        });

        const segmentList = items
          .map(
            (s) =>
              `- ${s.name}${s.contact_count !== undefined ? ` (${s.contact_count}+ contacts)` : ''}`,
          )
          .join('\n');
        const text =
          items.length > 0
            ? `Found ${items.length} segments:\n${segmentList}`
            : 'No segments found. Use action="create" to create one.';

        return {
          content: [{ type: 'text', text }],
          structuredContent: structured,
        };
      }

      case 'create': {
        if (!args.name) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: "name" is required for create action. Provide a segment name.',
              },
            ],
            isError: true,
          };
        }

        const result = await resend.createSegment(context, args.name);

        const structured = SegmentActionOutputSchema.parse({
          id: result.id,
          name: result.name,
          ok: true,
          action: 'created',
        });

        return {
          content: [
            {
              type: 'text',
              text: `Created segment "${args.name}". Use 'upsert_contacts' with segments=["${args.name}"] to add contacts.`,
            },
          ],
          structuredContent: structured,
        };
      }

      case 'delete': {
        if (!args.name) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: "name" is required for delete action. Provide the segment name to delete.',
              },
            ],
            isError: true,
          };
        }

        // Find segment by name
        const segments = await resend.listSegments(context);
        const segment = segments.data.find(
          (s) => s.name.toLowerCase() === args.name?.toLowerCase(),
        );

        if (!segment) {
          return {
            content: [
              {
                type: 'text',
                text: `Segment "${args.name}" not found. Use action="list" to see available segments.`,
              },
            ],
            isError: true,
          };
        }

        await resend.deleteSegment(context, segment.id);

        const structured = SegmentActionOutputSchema.parse({
          id: segment.id,
          name: segment.name,
          ok: true,
          action: 'deleted',
        });

        return {
          content: [
            {
              type: 'text',
              text: `Deleted segment "${args.name}". Contacts remain in system but are no longer in this segment.`,
            },
          ],
          structuredContent: structured,
        };
      }

      case 'add_contacts':
      case 'remove_contacts': {
        if (!args.name) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: "name" is required for ${args.action} action. Provide the segment name.`,
              },
            ],
            isError: true,
          };
        }

        if (!args.contacts || args.contacts.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: "contacts" array is required for ${args.action} action. Provide email addresses.`,
              },
            ],
            isError: true,
          };
        }

        // Find segment by name
        const segments = await resend.listSegments(context);
        const segment = segments.data.find(
          (s) => s.name.toLowerCase() === args.name?.toLowerCase(),
        );

        if (!segment) {
          return {
            content: [
              {
                type: 'text',
                text: `Segment "${args.name}" not found. Use action="list" to see available segments.`,
              },
            ],
            isError: true,
          };
        }

        const results: Array<{
          email: string;
          ok: boolean;
          id?: string;
          error?: string;
        }> = [];
        let success = 0;
        let failed = 0;

        for (const email of args.contacts) {
          try {
            if (args.action === 'add_contacts') {
              await resend.addContactToSegment(context, email, segment.id);
            } else {
              await resend.removeContactFromSegment(context, email, segment.id);
            }
            results.push({ email, ok: true });
            success++;
          } catch (error) {
            results.push({ email, ok: false, error: (error as Error).message });
            failed++;
          }
        }

        const structured = SegmentMembershipOutputSchema.parse({
          segment: args.name,
          results,
          summary: { success, failed },
        });

        const actionWord = args.action === 'add_contacts' ? 'added to' : 'removed from';
        const text = `${success} contacts ${actionWord} "${args.name}".${failed > 0 ? ` ${failed} failed (contacts may not exist).` : ''}`;

        return {
          content: [{ type: 'text', text }],
          structuredContent: structured,
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: `Unknown action. Use: list, create, delete, add_contacts, or remove_contacts.`,
            },
          ],
          isError: true,
        };
    }
  },
});
