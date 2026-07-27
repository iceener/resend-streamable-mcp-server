/**
 * Templates tool - list available email templates.
 */

import * as z from 'zod/v4';
import { toolsMetadata } from '../../../config/metadata.js';
import { TemplatesListOutputSchema } from '../../../schemas/outputs.js';
import * as resend from '../../../services/resend/client.js';
import { defineTool, type ToolContext, type ToolResult } from '../types.js';

const InputSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe('Maximum number of templates to return. Default 50, max 100.'),
  cursor: z
    .string()
    .optional()
    .describe(
      'Pagination cursor from previous response. Pass to get next page of results.',
    ),
});

export const templatesTool = defineTool({
  name: toolsMetadata.templates.name,
  title: toolsMetadata.templates.title,
  description: toolsMetadata.templates.description,
  inputSchema: InputSchema,
  outputSchema: TemplatesListOutputSchema,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
  },

  handler: async (args, context: ToolContext): Promise<ToolResult> => {
    const response = await resend.listTemplates(context, {
      limit: args.limit ?? 50,
      after: args.cursor,
    });

    // Fetch full details for each template to get variables
    const items = await Promise.all(
      response.data.map(async (template) => {
        try {
          const full = await resend.getTemplate(context, template.id);
          return {
            id: full.id,
            alias: full.alias,
            name: full.name,
            subject: full.subject,
            from: full.from,
            variables: full.variables?.map((v) => ({
              key: v.key,
              type: v.type,
              fallback: v.fallback_value,
            })),
            created_at: full.created_at,
          };
        } catch {
          return {
            id: template.id,
            name: template.name,
            created_at: template.created_at,
          };
        }
      }),
    );

    const structured = TemplatesListOutputSchema.parse({
      items,
      has_more: response.has_more,
      cursor:
        response.has_more && items.length > 0 ? items[items.length - 1].id : undefined,
    });

    if (items.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No templates found. Create templates in the Resend dashboard at resend.com/templates.',
          },
        ],
        structuredContent: structured,
      };
    }

    const templateList = items
      .map((t) => {
        const aliasInfo = t.alias ? ` (alias: "${t.alias}")` : '';
        const varsInfo =
          t.variables && t.variables.length > 0
            ? `\n    Variables: ${t.variables.map((v) => v.key).join(', ')}`
            : '';
        return `- ${t.name}${aliasInfo}: "${t.subject || 'No subject'}"${varsInfo}`;
      })
      .join('\n');

    const text = `Found ${items.length} templates:\n${templateList}\n\nUse template ID or alias in 'send' tool with template parameter.${response.has_more ? '\n\nMore available with cursor.' : ''}`;

    return {
      content: [{ type: 'text', text }],
      structuredContent: structured,
    };
  },
});
