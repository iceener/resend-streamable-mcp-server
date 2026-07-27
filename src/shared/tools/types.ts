import type { CallToolResult } from '@modelcontextprotocol/server';
import type * as z from 'zod/v4';

export type ProviderFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export interface ToolContext {
  signal: AbortSignal;
  resendApiKey?: string;
  resendDefaultFrom?: string;
  resendAllowedRecipients?: string[];
  providerFetch?: ProviderFetch;
}

export type ToolResult = CallToolResult;

export interface SharedToolDefinition<
  TInput extends z.ZodObject,
  TOutput extends z.ZodObject | undefined = undefined,
> {
  name: string;
  title?: string;
  description: string;
  inputSchema: TInput;
  outputSchema?: TOutput;
  annotations?: {
    title?: string;
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
  handler: (args: z.infer<TInput>, context: ToolContext) => Promise<ToolResult>;
}

export function defineTool<
  TInput extends z.ZodObject,
  TOutput extends z.ZodObject | undefined = undefined,
>(
  definition: SharedToolDefinition<TInput, TOutput>,
): SharedToolDefinition<TInput, TOutput> {
  return definition;
}
