/**
 * Campaigns tool - view history, check status, cancel scheduled.
 */

import { z } from 'zod';
import { toolsMetadata } from '../../../config/metadata.js';
import {
  CampaignsListOutputSchema,
  CampaignStatusOutputSchema,
  CampaignCancelOutputSchema,
} from '../../../schemas/outputs.js';
import * as resend from '../../../services/resend/client.js';
import { defineTool, type ToolContext, type ToolResult } from '../types.js';

const InputSchema = z.object({
  action: z.enum(['list', 'status', 'cancel']).describe(
    'Action to perform: "list" = get recent campaigns/broadcasts, "status" = get detailed status of specific campaign, "cancel" = cancel a scheduled campaign'
  ),
  campaign_id: z.string().optional().describe('Campaign/broadcast ID. Required for "status" and "cancel" actions. Get IDs from "list" action or from "send" tool response.'),
  limit: z.number().int().min(1).max(100).optional().describe('Number of campaigns to return for "list" action. Default 20, max 100.'),
  cursor: z.string().optional().describe('Pagination cursor from previous response. Pass to get next page of results.'),
});

export const campaignsTool = defineTool({
  name: toolsMetadata.campaigns.name,
  title: toolsMetadata.campaigns.title,
  description: toolsMetadata.campaigns.description,
  inputSchema: InputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
  },

  handler: async (args, context: ToolContext): Promise<ToolResult> => {
    switch (args.action) {
      case 'list': {
        const response = await resend.listBroadcasts(context, {
          limit: args.limit ?? 20,
          after: args.cursor,
        });

        // Resolve segment names
        const segments = await resend.listSegments(context);
        const segmentMap = new Map(segments.data.map(s => [s.id, s.name]));

        const items = response.data.map(broadcast => ({
          id: broadcast.id,
          name: broadcast.name,
          subject: broadcast.subject,
          segment_id: broadcast.segment_id,
          segment_name: segmentMap.get(broadcast.segment_id),
          status: broadcast.status,
          created_at: broadcast.created_at,
          sent_at: broadcast.sent_at,
          scheduled_at: broadcast.scheduled_at,
        }));

        const structured = CampaignsListOutputSchema.parse({
          items,
          has_more: response.has_more,
          cursor: response.has_more && items.length > 0 ? items[items.length - 1].id : undefined,
        });

        if (items.length === 0) {
          return {
            content: [{ type: 'text', text: 'No campaigns found. Use "send" tool with segment parameter to create a broadcast campaign.' }],
            structuredContent: structured,
          };
        }

        const campaignList = items.map(c => {
          const segmentInfo = c.segment_name ? ` → ${c.segment_name}` : '';
          const scheduleInfo = c.scheduled_at ? ` (scheduled: ${c.scheduled_at})` : '';
          return `- [${c.status.toUpperCase()}] ${c.subject}${segmentInfo}${scheduleInfo} (ID: ${c.id})`;
        }).join('\n');

        const text = `Found ${items.length} campaigns:\n${campaignList}${response.has_more ? '\n\nMore available with cursor.' : ''}`;

        return {
          content: [{ type: 'text', text }],
          structuredContent: structured,
        };
      }

      case 'status': {
        if (!args.campaign_id) {
          return {
            content: [{ type: 'text', text: 'Error: "campaign_id" is required for status action. Get IDs from action="list" or from "send" tool response.' }],
            isError: true,
          };
        }

        const broadcast = await resend.getBroadcast(context, args.campaign_id);

        const structured = CampaignStatusOutputSchema.parse({
          id: broadcast.id,
          status: broadcast.status,
        });

        const statusDescriptions: Record<string, string> = {
          draft: 'Not yet sent. Can be modified or deleted.',
          queued: 'Queued for sending. Will be sent shortly.',
          sending: 'Currently being sent to recipients.',
          sent: 'Successfully sent to all recipients.',
          cancelled: 'Cancelled before sending.',
        };

        const description = statusDescriptions[broadcast.status] || 'Unknown status.';
        const text = `Campaign ${broadcast.id}: ${broadcast.status.toUpperCase()}\n${description}`;

        return {
          content: [{ type: 'text', text }],
          structuredContent: structured,
        };
      }

      case 'cancel': {
        if (!args.campaign_id) {
          return {
            content: [{ type: 'text', text: 'Error: "campaign_id" is required for cancel action. Get IDs from action="list".' }],
            isError: true,
          };
        }

        try {
          await resend.deleteBroadcast(context, args.campaign_id);
          
          const structured = CampaignCancelOutputSchema.parse({
            id: args.campaign_id,
            cancelled: true,
          });

          return {
            content: [{ type: 'text', text: `Campaign ${args.campaign_id} cancelled successfully.` }],
            structuredContent: structured,
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Failed to cancel: ${(error as Error).message}. Only draft or scheduled campaigns can be cancelled. Already-sent campaigns cannot be undone.` }],
            isError: true,
          };
        }
      }

      default:
        return {
          content: [{ type: 'text', text: 'Unknown action. Use: list, status, or cancel.' }],
          isError: true,
        };
    }
  },
});
