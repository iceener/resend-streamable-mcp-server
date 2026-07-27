import * as z from 'zod/v4';

// ─────────────────────────────────────────────────────────────────────────────
// Common schemas
// ─────────────────────────────────────────────────────────────────────────────

export const PageInfoSchema = z.object({
  has_more: z.boolean(),
  cursor: z.string().optional(),
});

export const BatchResultSchema = z.object({
  email: z.string(),
  ok: z.boolean(),
  id: z.string().optional(),
  error: z.string().optional(),
});

export const BatchSummarySchema = z.object({
  success: z.number(),
  failed: z.number(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Contacts
// ─────────────────────────────────────────────────────────────────────────────

export const ContactSchema = z.object({
  id: z.string(),
  email: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  unsubscribed: z.boolean(),
  created_at: z.string(),
  properties: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

export const UpsertContactsOutputSchema = z.object({
  results: z.array(
    z.object({
      email: z.string(),
      ok: z.boolean(),
      id: z.string().optional(),
      action: z.enum(['created', 'updated']).optional(),
      error: z.string().optional(),
    }),
  ),
  summary: z.object({
    created: z.number(),
    updated: z.number(),
    failed: z.number(),
  }),
});
export type UpsertContactsOutput = z.infer<typeof UpsertContactsOutputSchema>;

export const RemoveContactsOutputSchema = z.object({
  results: z.array(BatchResultSchema),
  summary: z.object({
    deleted: z.number(),
    failed: z.number(),
  }),
});
export type RemoveContactsOutput = z.infer<typeof RemoveContactsOutputSchema>;

export const FindContactsOutputSchema = z
  .object({
    items: z.array(ContactSchema),
  })
  .merge(PageInfoSchema);
export type FindContactsOutput = z.infer<typeof FindContactsOutputSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Segments
// ─────────────────────────────────────────────────────────────────────────────

export const SegmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  contact_count: z.number().optional(),
  created_at: z.string(),
});

export const SegmentsListOutputSchema = z
  .object({
    items: z.array(SegmentSchema),
  })
  .merge(PageInfoSchema);
export type SegmentsListOutput = z.infer<typeof SegmentsListOutputSchema>;

export const SegmentsOutputSchema = z.object({
  items: z.array(SegmentSchema).optional(),
  has_more: z.boolean().optional(),
  cursor: z.string().optional(),
  id: z.string().optional(),
  name: z.string().optional(),
  ok: z.boolean().optional(),
  action: z.enum(['created', 'deleted']).optional(),
  segment: z.string().optional(),
  results: z.array(BatchResultSchema).optional(),
  summary: BatchSummarySchema.optional(),
});

export const SegmentActionOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  ok: z.boolean(),
  action: z.enum(['created', 'deleted']),
});
export type SegmentActionOutput = z.infer<typeof SegmentActionOutputSchema>;

export const SegmentMembershipOutputSchema = z.object({
  segment: z.string(),
  results: z.array(BatchResultSchema),
  summary: BatchSummarySchema,
});
export type SegmentMembershipOutput = z.infer<typeof SegmentMembershipOutputSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Send
// ─────────────────────────────────────────────────────────────────────────────

export const SendIndividualOutputSchema = z.object({
  id: z.string(),
  to: z.array(z.string()),
  subject: z.string(),
  status: z.enum(['sent', 'scheduled']),
  scheduled_at: z.string().optional(),
});
export type SendIndividualOutput = z.infer<typeof SendIndividualOutputSchema>;

export const SendBroadcastOutputSchema = z.object({
  campaign_id: z.string(),
  segment: z.string(),
  subject: z.string(),
  status: z.enum(['sent', 'scheduled', 'queued']),
  scheduled_at: z.string().optional(),
});
export type SendBroadcastOutput = z.infer<typeof SendBroadcastOutputSchema>;

export const SendOutputSchema = z.object({
  id: z.string().optional(),
  to: z.array(z.string()).optional(),
  campaign_id: z.string().optional(),
  segment: z.string().optional(),
  subject: z.string(),
  status: z.enum(['sent', 'scheduled', 'queued']),
  scheduled_at: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Campaigns
// ─────────────────────────────────────────────────────────────────────────────

export const CampaignSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  subject: z.string(),
  segment_id: z.string().optional(),
  segment_name: z.string().optional(),
  status: z.enum(['draft', 'queued', 'sending', 'sent', 'cancelled']),
  created_at: z.string(),
  sent_at: z.string().optional(),
  scheduled_at: z.string().optional(),
});

export const CampaignsListOutputSchema = z
  .object({
    items: z.array(CampaignSchema),
  })
  .merge(PageInfoSchema);
export type CampaignsListOutput = z.infer<typeof CampaignsListOutputSchema>;

export const CampaignStatusOutputSchema = z.object({
  id: z.string(),
  status: z.string(),
  sent_count: z.number().optional(),
  delivered_count: z.number().optional(),
  opened_count: z.number().optional(),
  clicked_count: z.number().optional(),
  bounced_count: z.number().optional(),
});
export type CampaignStatusOutput = z.infer<typeof CampaignStatusOutputSchema>;

export const CampaignCancelOutputSchema = z.object({
  id: z.string(),
  cancelled: z.boolean(),
});
export type CampaignCancelOutput = z.infer<typeof CampaignCancelOutputSchema>;

export const CampaignsOutputSchema = z.object({
  items: z.array(CampaignSchema).optional(),
  has_more: z.boolean().optional(),
  cursor: z.string().optional(),
  id: z.string().optional(),
  status: z.string().optional(),
  sent_count: z.number().optional(),
  delivered_count: z.number().optional(),
  opened_count: z.number().optional(),
  clicked_count: z.number().optional(),
  bounced_count: z.number().optional(),
  cancelled: z.boolean().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Subscriptions
// ─────────────────────────────────────────────────────────────────────────────

export const SubscriptionsOutputSchema = z.object({
  results: z.array(BatchResultSchema),
  summary: BatchSummarySchema,
});
export type SubscriptionsOutput = z.infer<typeof SubscriptionsOutputSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────────────────────────────────────

export const TemplateVariableSchema = z.object({
  key: z.string(),
  type: z.enum(['string', 'number']),
  fallback: z.union([z.string(), z.number()]).optional(),
});

export const TemplateSchema = z.object({
  id: z.string(),
  alias: z.string().optional(),
  name: z.string(),
  subject: z.string().optional(),
  from: z.string().optional(),
  variables: z.array(TemplateVariableSchema).optional(),
  created_at: z.string(),
});

export const TemplatesListOutputSchema = z
  .object({
    items: z.array(TemplateSchema),
  })
  .merge(PageInfoSchema);
export type TemplatesListOutput = z.infer<typeof TemplatesListOutputSchema>;
