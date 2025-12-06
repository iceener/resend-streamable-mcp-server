/**
 * Upsert Contacts tool - add or update contacts in bulk.
 */

import { z } from 'zod';
import { toolsMetadata } from '../../../config/metadata.js';
import { UpsertContactsOutputSchema } from '../../../schemas/outputs.js';
import * as resend from '../../../services/resend/client.js';
import { defineTool, type ToolContext, type ToolResult } from '../types.js';

const ContactInputSchema = z.object({
  email: z.string().email().describe('Email address of the contact (required, used as unique identifier)'),
  first_name: z.string().optional().describe('First name of the contact'),
  last_name: z.string().optional().describe('Last name of the contact'),
  properties: z.record(z.union([z.string(), z.number()])).optional().describe('Custom properties as key-value pairs, e.g. {"company": "Acme", "plan": "pro"}'),
});

const InputSchema = z.object({
  contacts: z.array(ContactInputSchema).min(1).max(100).describe('Array of contacts to add or update. Each contact must have an email. Max 100 per call.'),
  segments: z.array(z.string()).optional().describe('Segment names to add all contacts to, e.g. ["Newsletter", "Premium Users"]. Creates membership if segment exists.'),
  unsubscribed: z.boolean().optional().describe('Set global unsubscribe status for all contacts. true = unsubscribed from all broadcasts.'),
});

export const upsertContactsTool = defineTool({
  name: toolsMetadata.upsert_contacts.name,
  title: toolsMetadata.upsert_contacts.title,
  description: toolsMetadata.upsert_contacts.description,
  inputSchema: InputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },

  handler: async (args, context: ToolContext): Promise<ToolResult> => {
    const results: Array<{
      email: string;
      ok: boolean;
      id?: string;
      action?: 'created' | 'updated';
      error?: string;
    }> = [];

    let created = 0;
    let updated = 0;
    let failed = 0;

    // Resolve segment IDs from names if provided
    const segmentIds: string[] = [];
    if (args.segments && args.segments.length > 0) {
      const segmentsResponse = await resend.listSegments(context);
      const segmentMap = new Map(segmentsResponse.data.map(s => [s.name.toLowerCase(), s.id]));
      
      for (const segmentName of args.segments) {
        const segmentId = segmentMap.get(segmentName.toLowerCase());
        if (segmentId) {
          segmentIds.push(segmentId);
        }
      }
    }

    // Process each contact
    for (const contact of args.contacts) {
      try {
        // Try to get existing contact
        let existingContact: resend.Contact | null = null;
        try {
          existingContact = await resend.getContact(context, contact.email);
        } catch {
          // Contact doesn't exist, will create
        }

        if (existingContact) {
          // Update existing contact
          const updateParams: Partial<resend.CreateContactParams> = {};
          if (contact.first_name !== undefined) updateParams.first_name = contact.first_name;
          if (contact.last_name !== undefined) updateParams.last_name = contact.last_name;
          if (contact.properties !== undefined) updateParams.properties = contact.properties;
          if (args.unsubscribed !== undefined) updateParams.unsubscribed = args.unsubscribed;

          await resend.updateContact(context, contact.email, updateParams);
          results.push({ email: contact.email, ok: true, id: existingContact.id, action: 'updated' });
          updated++;
        } else {
          // Create new contact
          const createParams: resend.CreateContactParams = {
            email: contact.email,
            first_name: contact.first_name,
            last_name: contact.last_name,
            properties: contact.properties,
            unsubscribed: args.unsubscribed ?? false,
          };

          const result = await resend.createContact(context, createParams);
          results.push({ email: contact.email, ok: true, id: result.id, action: 'created' });
          created++;
        }

        // Add to segments if specified
        for (const segmentId of segmentIds) {
          try {
            await resend.addContactToSegment(context, contact.email, segmentId);
          } catch {
            // Ignore segment add errors - contact was still created/updated
          }
        }
      } catch (error) {
        results.push({ 
          email: contact.email, 
          ok: false, 
          error: (error as Error).message 
        });
        failed++;
      }
    }

    const structured = UpsertContactsOutputSchema.parse({
      results,
      summary: { created, updated, failed },
    });

    const text = `Processed ${args.contacts.length} contacts: ${created} created, ${updated} updated, ${failed} failed.`;

    return {
      content: [{ type: 'text', text }],
      structuredContent: structured,
    };
  },
});
