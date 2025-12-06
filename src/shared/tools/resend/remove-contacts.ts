/**
 * Remove Contacts tool - delete contacts by email.
 */

import { z } from 'zod';
import { toolsMetadata } from '../../../config/metadata.js';
import { RemoveContactsOutputSchema } from '../../../schemas/outputs.js';
import * as resend from '../../../services/resend/client.js';
import { defineTool, type ToolContext, type ToolResult } from '../types.js';

const InputSchema = z.object({
  emails: z.array(z.string().email()).min(1).max(100).describe('Array of email addresses to delete from the mailing list. Max 100 per call. This permanently removes contacts.'),
});

export const removeContactsTool = defineTool({
  name: toolsMetadata.remove_contacts.name,
  title: toolsMetadata.remove_contacts.title,
  description: toolsMetadata.remove_contacts.description,
  inputSchema: InputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
  },

  handler: async (args, context: ToolContext): Promise<ToolResult> => {
    const results: Array<{
      email: string;
      ok: boolean;
      id?: string;
      error?: string;
    }> = [];

    let deleted = 0;
    let failed = 0;

    for (const email of args.emails) {
      try {
        const result = await resend.deleteContact(context, email);
        results.push({ email, ok: true, id: result.id });
        deleted++;
      } catch (error) {
        results.push({ 
          email, 
          ok: false, 
          error: (error as Error).message 
        });
        failed++;
      }
    }

    const structured = RemoveContactsOutputSchema.parse({
      results,
      summary: { deleted, failed },
    });

    const text = `Removed ${deleted} contacts. ${failed > 0 ? `${failed} failed.` : ''}`;

    return {
      content: [{ type: 'text', text }],
      structuredContent: structured,
    };
  },
});
