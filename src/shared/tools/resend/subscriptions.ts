/**
 * Subscriptions tool - manage contact topic preferences.
 */

import { z } from 'zod';
import { toolsMetadata } from '../../../config/metadata.js';
import { SubscriptionsOutputSchema } from '../../../schemas/outputs.js';
import * as resend from '../../../services/resend/client.js';
import { defineTool, type ToolContext, type ToolResult } from '../types.js';

const InputSchema = z.object({
  emails: z.union([z.string().email(), z.array(z.string().email())]).describe(
    'Contact email(s) to update subscription preferences. Single email or array up to 100.'
  ),
  action: z.enum(['subscribe', 'unsubscribe', 'unsubscribe_all']).describe(
    'Action: "subscribe" = opt-in to topic, "unsubscribe" = opt-out from topic, "unsubscribe_all" = global unsubscribe from all emails'
  ),
  topic: z.string().optional().describe(
    'Topic name (required for subscribe/unsubscribe). Topics are used to segment email types e.g. "Newsletter", "Product Updates". Not required for unsubscribe_all.'
  ),
});

export const subscriptionsTool = defineTool({
  name: toolsMetadata.subscriptions.name,
  title: toolsMetadata.subscriptions.title,
  description: toolsMetadata.subscriptions.description,
  inputSchema: InputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },

  handler: async (args, context: ToolContext): Promise<ToolResult> => {
    const emails = Array.isArray(args.emails) ? args.emails : [args.emails];

    if (emails.length > 100) {
      return {
        content: [{ type: 'text', text: 'Error: Maximum 100 emails per call. Split into multiple calls for larger batches.' }],
        isError: true,
      };
    }

    // For topic-specific actions, validate topic is provided
    if ((args.action === 'subscribe' || args.action === 'unsubscribe') && !args.topic) {
      return {
        content: [{ type: 'text', text: `Error: "topic" is required for ${args.action} action. Provide the topic name.` }],
        isError: true,
      };
    }

    // Resolve topic ID if topic-specific action
    let topicId: string | undefined;
    if (args.topic) {
      const topics = await resend.listTopics(context);
      const topic = topics.data.find(
        t => t.name.toLowerCase() === args.topic!.toLowerCase()
      );
      if (!topic) {
        return {
          content: [{ type: 'text', text: `Topic "${args.topic}" not found. Available topics can be found in the Resend dashboard.` }],
          isError: true,
        };
      }
      topicId = topic.id;
    }

    const results: Array<{ email: string; ok: boolean; error?: string }> = [];
    let success = 0;
    let failed = 0;

    for (const email of emails) {
      try {
        if (args.action === 'unsubscribe_all') {
          // Global unsubscribe - update contact's unsubscribed field
          await resend.updateContact(context, email, { unsubscribed: true });
        } else if (topicId) {
          // Topic-specific subscription (Resend uses opt_in/opt_out)
          const subscription = args.action === 'subscribe' ? 'opt_in' : 'opt_out';
          await resend.updateContactTopics(context, email, [
            { id: topicId, subscription }
          ]);
        }
        results.push({ email, ok: true });
        success++;
      } catch (error) {
        results.push({ email, ok: false, error: (error as Error).message });
        failed++;
      }
    }

    const structured = SubscriptionsOutputSchema.parse({
      results,
      summary: { success, failed },
    });

    let actionText: string;
    if (args.action === 'unsubscribe_all') {
      actionText = 'globally unsubscribed';
    } else {
      actionText = `${args.action}d ${args.action === 'subscribe' ? 'to' : 'from'} "${args.topic}"`;
    }

    const text = `${success} contact(s) ${actionText}.${failed > 0 ? ` ${failed} failed (contacts may not exist).` : ''}`;

    return {
      content: [{ type: 'text', text }],
      structuredContent: structured,
    };
  },
});
