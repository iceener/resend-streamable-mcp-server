/**
 * Resend API client for MCP tools.
 */

import { config } from '../../config/env.js';
import type { ToolContext } from '../../shared/tools/types.js';
import { logger } from '../../utils/logger.js';

const RESEND_API_BASE = 'https://api.resend.com';

export interface ResendError {
  name: string;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  object: 'list';
  has_more: boolean;
  data: T[];
}

/**
 * Get the Resend API key from server config.
 * The API key is stored server-side, clients authenticate with BEARER_TOKEN.
 */
function getApiKey(): string {
  if (!config.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured. Set it in environment.');
  }
  return config.RESEND_API_KEY;
}

async function request<T>(
  context: ToolContext,
  method: string,
  path: string,
  body?: Record<string, unknown>,
  queryParams?: Record<string, string | number | undefined>,
): Promise<T> {
  const token = getApiKey();

  let url = `${RESEND_API_BASE}${path}`;
  
  // Add query params
  if (queryParams) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    }
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  logger.debug('resend_client', { message: 'API request', method, path });

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: context.signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText })) as { message?: string };
    logger.error('resend_client', { 
      message: 'API error', 
      status: response.status, 
      error: errorData 
    });
    throw new Error(errorData.message || `Resend API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Contacts
// ─────────────────────────────────────────────────────────────────────────────

export interface Contact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  unsubscribed: boolean;
  created_at: string;
  properties?: Record<string, string | number>;
}

export interface CreateContactParams {
  email: string;
  first_name?: string;
  last_name?: string;
  unsubscribed?: boolean;
  properties?: Record<string, string | number>;
}

export async function createContact(
  context: ToolContext,
  params: CreateContactParams,
): Promise<{ object: string; id: string }> {
  return request(context, 'POST', '/contacts', params as unknown as Record<string, unknown>);
}

export async function getContact(
  context: ToolContext,
  idOrEmail: string,
): Promise<Contact> {
  return request(context, 'GET', `/contacts/${encodeURIComponent(idOrEmail)}`);
}

export async function updateContact(
  context: ToolContext,
  idOrEmail: string,
  params: Partial<Omit<CreateContactParams, 'email'>>,
): Promise<{ object: string; id: string }> {
  return request(context, 'PATCH', `/contacts/${encodeURIComponent(idOrEmail)}`, params);
}

export async function deleteContact(
  context: ToolContext,
  idOrEmail: string,
): Promise<{ object: string; id: string; deleted: boolean }> {
  return request(context, 'DELETE', `/contacts/${encodeURIComponent(idOrEmail)}`);
}

export async function listContacts(
  context: ToolContext,
  segmentId?: string,
  options?: { limit?: number; after?: string; before?: string },
): Promise<PaginatedResponse<Contact>> {
  const path = segmentId ? `/segments/${segmentId}/contacts` : '/contacts';
  return request(context, 'GET', path, undefined, options);
}

// ─────────────────────────────────────────────────────────────────────────────
// Contact Segments
// ─────────────────────────────────────────────────────────────────────────────

export async function addContactToSegment(
  context: ToolContext,
  contactIdOrEmail: string,
  segmentId: string,
): Promise<{ object: string; id: string }> {
  return request(context, 'POST', `/contacts/${encodeURIComponent(contactIdOrEmail)}/segments/${segmentId}`);
}

export async function removeContactFromSegment(
  context: ToolContext,
  contactIdOrEmail: string,
  segmentId: string,
): Promise<{ object: string; id: string; deleted: boolean }> {
  return request(context, 'DELETE', `/contacts/${encodeURIComponent(contactIdOrEmail)}/segments/${segmentId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Segments
// ─────────────────────────────────────────────────────────────────────────────

export interface Segment {
  id: string;
  name: string;
  created_at: string;
}

export async function createSegment(
  context: ToolContext,
  name: string,
): Promise<{ object: string; id: string; name: string }> {
  return request(context, 'POST', '/segments', { name });
}

export async function getSegment(
  context: ToolContext,
  segmentId: string,
): Promise<Segment> {
  return request(context, 'GET', `/segments/${segmentId}`);
}

export async function listSegments(
  context: ToolContext,
  options?: { limit?: number; after?: string; before?: string },
): Promise<PaginatedResponse<Segment>> {
  return request(context, 'GET', '/segments', undefined, options);
}

export async function deleteSegment(
  context: ToolContext,
  segmentId: string,
): Promise<{ object: string; id: string; deleted: boolean }> {
  return request(context, 'DELETE', `/segments/${segmentId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Emails
// ─────────────────────────────────────────────────────────────────────────────

export interface Attachment {
  /** Content of an attached file, passed as a Base64 string */
  content?: string;
  /** Name of attached file */
  filename: string;
  /** URL path where the attachment file is hosted (better for larger attachments) */
  path?: string;
  /** Content type for the attachment, if not set will be derived from the filename */
  content_type?: string;
  /** Content ID for embedding images inline via cid: */
  content_id?: string;
}

export interface SendEmailParams {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  reply_to?: string | string[];
  bcc?: string | string[];
  cc?: string | string[];
  scheduled_at?: string;
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
  template?: {
    id: string;
    variables?: Record<string, string | number>;
  };
  attachments?: Attachment[];
}

export interface SentEmail {
  id: string;
}

export async function sendEmail(
  context: ToolContext,
  params: SendEmailParams,
): Promise<SentEmail> {
  return request(context, 'POST', '/emails', params as unknown as Record<string, unknown>);
}

export interface Email {
  id: string;
  object: string;
  to: string[];
  from: string;
  subject: string;
  html?: string;
  text?: string;
  bcc?: string[];
  cc?: string[];
  reply_to?: string[];
  last_event: string;
  created_at: string;
  scheduled_at?: string;
}

export async function getEmail(
  context: ToolContext,
  emailId: string,
): Promise<Email> {
  return request(context, 'GET', `/emails/${emailId}`);
}

export async function listEmails(
  context: ToolContext,
  options?: { limit?: number; after?: string; before?: string },
): Promise<PaginatedResponse<Email>> {
  return request(context, 'GET', '/emails', undefined, options);
}

export async function cancelEmail(
  context: ToolContext,
  emailId: string,
): Promise<{ object: string; id: string; cancelled: boolean }> {
  return request(context, 'POST', `/emails/${emailId}/cancel`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Broadcasts
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateBroadcastParams {
  segment_id: string;
  from: string;
  subject: string;
  html?: string;
  text?: string;
  reply_to?: string | string[];
  name?: string;
}

export interface Broadcast {
  id: string;
  name?: string;
  segment_id: string;
  from: string;
  subject: string;
  html?: string;
  text?: string;
  status: 'draft' | 'queued' | 'sending' | 'sent' | 'cancelled';
  created_at: string;
  scheduled_at?: string;
  sent_at?: string;
}

export async function createBroadcast(
  context: ToolContext,
  params: CreateBroadcastParams,
): Promise<{ id: string }> {
  return request(context, 'POST', '/broadcasts', params as unknown as Record<string, unknown>);
}

export async function sendBroadcast(
  context: ToolContext,
  broadcastId: string,
  scheduledAt?: string,
): Promise<{ id: string }> {
  return request(context, 'POST', `/broadcasts/${broadcastId}/send`, 
    scheduledAt ? { scheduled_at: scheduledAt } : undefined);
}

export async function getBroadcast(
  context: ToolContext,
  broadcastId: string,
): Promise<Broadcast> {
  return request(context, 'GET', `/broadcasts/${broadcastId}`);
}

export async function listBroadcasts(
  context: ToolContext,
  options?: { limit?: number; after?: string; before?: string },
): Promise<PaginatedResponse<Broadcast>> {
  return request(context, 'GET', '/broadcasts', undefined, options);
}

export async function deleteBroadcast(
  context: ToolContext,
  broadcastId: string,
): Promise<{ object: string; id: string; deleted: boolean }> {
  return request(context, 'DELETE', `/broadcasts/${broadcastId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Topics
// ─────────────────────────────────────────────────────────────────────────────

export interface Topic {
  id: string;
  name: string;
  description?: string;
  default_subscription: 'opt_in' | 'opt_out';
  visibility: 'public' | 'private';
  created_at: string;
}

export async function listTopics(
  context: ToolContext,
  options?: { limit?: number; after?: string; before?: string },
): Promise<PaginatedResponse<Topic>> {
  return request(context, 'GET', '/topics', undefined, options);
}

export async function getTopic(
  context: ToolContext,
  topicId: string,
): Promise<Topic> {
  return request(context, 'GET', `/topics/${topicId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Contact Topics (Subscriptions)
// ─────────────────────────────────────────────────────────────────────────────

export interface ContactTopicSubscription {
  id: string;
  name: string;
  subscription: 'opt_in' | 'opt_out';
}

export async function getContactTopics(
  context: ToolContext,
  contactIdOrEmail: string,
): Promise<PaginatedResponse<ContactTopicSubscription>> {
  return request(context, 'GET', `/contacts/${encodeURIComponent(contactIdOrEmail)}/topics`);
}

export async function updateContactTopics(
  context: ToolContext,
  contactIdOrEmail: string,
  topics: Array<{ id: string; subscription: 'opt_in' | 'opt_out' }>,
): Promise<{ id: string }> {
  return request(context, 'PATCH', `/contacts/${encodeURIComponent(contactIdOrEmail)}/topics`, { topics });
}

// ─────────────────────────────────────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────────────────────────────────────

export interface TemplateVariable {
  id: string;
  key: string;
  type: 'string' | 'number';
  fallback_value?: string | number;
  created_at?: string;
  updated_at?: string;
}

export interface Template {
  id: string;
  name: string;
  alias?: string;
  subject?: string;
  from?: string;
  reply_to?: string;
  html?: string;
  text?: string;
  status?: 'draft' | 'published';
  created_at: string;
  updated_at?: string;
  published_at?: string;
  variables?: TemplateVariable[];
  has_unpublished_versions?: boolean;
}

export async function listTemplates(
  context: ToolContext,
  options?: { limit?: number; after?: string; before?: string },
): Promise<PaginatedResponse<Template>> {
  return request(context, 'GET', '/templates', undefined, options);
}

export async function getTemplate(
  context: ToolContext,
  idOrAlias: string,
): Promise<Template> {
  return request(context, 'GET', `/templates/${encodeURIComponent(idOrAlias)}`);
}

