import type { McpServer, ServerContext } from '@modelcontextprotocol/server';
import type { AppConfig } from '../../config/env.js';
import { campaignsTool } from './resend/campaigns.js';
import { findContactsTool } from './resend/find-contacts.js';
import { removeContactsTool } from './resend/remove-contacts.js';
import { segmentsTool } from './resend/segments.js';
import { sendTool } from './resend/send.js';
import { subscriptionsTool } from './resend/subscriptions.js';
import { templatesTool } from './resend/templates.js';
import { upsertContactsTool } from './resend/upsert-contacts.js';
import type { ProviderFetch, ToolContext } from './types.js';

export interface ToolRegistrationOptions {
  providerFetch?: ProviderFetch;
}

function toolContext(
  ctx: ServerContext,
  config: AppConfig,
  options: ToolRegistrationOptions,
): ToolContext {
  return {
    signal: ctx.mcpReq.signal,
    resendApiKey: config.RESEND_API_KEY,
    resendDefaultFrom: config.RESEND_DEFAULT_FROM,
    resendAllowedRecipients: config.RESEND_ALLOWED_RECIPIENTS,
    ...(options.providerFetch ? { providerFetch: options.providerFetch } : {}),
  };
}

/** Register every existing Resend tool in its stable order. */
export function registerTools(
  server: McpServer,
  config: AppConfig,
  options: ToolRegistrationOptions = {},
): void {
  server.registerTool(
    upsertContactsTool.name,
    {
      title: upsertContactsTool.title,
      description: upsertContactsTool.description,
      inputSchema: upsertContactsTool.inputSchema,
      outputSchema: upsertContactsTool.outputSchema,
      annotations: upsertContactsTool.annotations,
    },
    async (args, ctx) =>
      upsertContactsTool.handler(args, toolContext(ctx, config, options)),
  );
  server.registerTool(
    removeContactsTool.name,
    {
      title: removeContactsTool.title,
      description: removeContactsTool.description,
      inputSchema: removeContactsTool.inputSchema,
      outputSchema: removeContactsTool.outputSchema,
      annotations: removeContactsTool.annotations,
    },
    async (args, ctx) =>
      removeContactsTool.handler(args, toolContext(ctx, config, options)),
  );
  server.registerTool(
    findContactsTool.name,
    {
      title: findContactsTool.title,
      description: findContactsTool.description,
      inputSchema: findContactsTool.inputSchema,
      outputSchema: findContactsTool.outputSchema,
      annotations: findContactsTool.annotations,
    },
    async (args, ctx) =>
      findContactsTool.handler(args, toolContext(ctx, config, options)),
  );
  server.registerTool(
    segmentsTool.name,
    {
      title: segmentsTool.title,
      description: segmentsTool.description,
      inputSchema: segmentsTool.inputSchema,
      outputSchema: segmentsTool.outputSchema,
      annotations: segmentsTool.annotations,
    },
    async (args, ctx) => segmentsTool.handler(args, toolContext(ctx, config, options)),
  );
  server.registerTool(
    sendTool.name,
    {
      title: sendTool.title,
      description: sendTool.description,
      inputSchema: sendTool.inputSchema,
      outputSchema: sendTool.outputSchema,
      annotations: sendTool.annotations,
    },
    async (args, ctx) => sendTool.handler(args, toolContext(ctx, config, options)),
  );
  server.registerTool(
    campaignsTool.name,
    {
      title: campaignsTool.title,
      description: campaignsTool.description,
      inputSchema: campaignsTool.inputSchema,
      outputSchema: campaignsTool.outputSchema,
      annotations: campaignsTool.annotations,
    },
    async (args, ctx) => campaignsTool.handler(args, toolContext(ctx, config, options)),
  );
  server.registerTool(
    subscriptionsTool.name,
    {
      title: subscriptionsTool.title,
      description: subscriptionsTool.description,
      inputSchema: subscriptionsTool.inputSchema,
      outputSchema: subscriptionsTool.outputSchema,
      annotations: subscriptionsTool.annotations,
    },
    async (args, ctx) =>
      subscriptionsTool.handler(args, toolContext(ctx, config, options)),
  );
  server.registerTool(
    templatesTool.name,
    {
      title: templatesTool.title,
      description: templatesTool.description,
      inputSchema: templatesTool.inputSchema,
      outputSchema: templatesTool.outputSchema,
      annotations: templatesTool.annotations,
    },
    async (args, ctx) => templatesTool.handler(args, toolContext(ctx, config, options)),
  );
}
