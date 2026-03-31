import Anthropic from "@anthropic-ai/sdk";
import { TOOL_DEFINITIONS, executeTool, type ToolExecutionContext } from "./tools.server";
import { buildSystemPrompt, type StoreContext } from "./prompts";
import { getRecentMessages, createMessage, createToolCall, updateToolCall } from "~/lib/db/queries.server";
import { decrypt } from "~/lib/crypto/encryption.server";
import { logger } from "~/lib/logger.server";
import type { SSEEvent } from "@delivai/shared-types";

const MAX_TOKENS = 1024;
const MODEL = "claude-sonnet-4-6";

export interface RunAgentOptions {
  conversationId: string;
  storeId: string;
  encryptedClaudeApiKey: string;
  storeCtx: StoreContext;
  toolCtx: Omit<ToolExecutionContext, "conversationId" | "storeId">;
  userMessage: string;
  onEvent: (event: SSEEvent) => void;
}

/**
 * Run the Claude AI agent with streaming tool use.
 * Calls onEvent for each SSE event: token, tool_start, tool_result, message_complete, escalated, error
 */
export async function runAgent(opts: RunAgentOptions): Promise<void> {
  const {
    conversationId,
    storeId,
    encryptedClaudeApiKey,
    storeCtx,
    toolCtx,
    userMessage,
    onEvent,
  } = opts;

  const log = logger.child({ conversationId, storeId });

  // Decrypt merchant's API key (BYOK)
  let claudeApiKey: string;
  try {
    claudeApiKey = decrypt(encryptedClaudeApiKey);
  } catch {
    onEvent({ type: "error", data: { message: "AI configuration error. Please contact support." } });
    return;
  }

  const anthropic = new Anthropic({ apiKey: claudeApiKey });

  // Load history BEFORE saving the new message to avoid duplication
  const history = await getRecentMessages(conversationId, 20);
  const messages: Anthropic.MessageParam[] = history
    .reverse()
    .filter((m) => !m.isInternal)
    .map((m) => ({
      role: m.role === "customer" ? "user" : "assistant",
      content: m.content,
    }));

  // Save customer message and append to context
  await createMessage({ conversationId, role: "customer", content: userMessage });
  messages.push({ role: "user", content: userMessage });

  const ctx: ToolExecutionContext = { conversationId, storeId, ...toolCtx };
  let assistantContent = "";
  let escalated = false;

  const MAX_TOOL_ITERATIONS = 10;
  let iterations = 0;

  // Tool-use loop — runs until stop_reason is "end_turn" or iteration cap
  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations++;
    try {
      const stream = anthropic.messages.stream({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: buildSystemPrompt(storeCtx),
        tools: TOOL_DEFINITIONS,
        messages,
      });

      const toolUseBlocks: Anthropic.ToolUseBlock[] = [];
      let currentToolBlock: Partial<Anthropic.ToolUseBlock> | null = null;
      let currentToolInput = "";

      // Process streaming events
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for await (const event of stream as AsyncIterable<any>) {
        switch (event.type) {
          case "content_block_start":
            if (event.content_block.type === "text") {
              // Text block starting
            } else if (event.content_block.type === "tool_use") {
              currentToolBlock = { ...event.content_block, input: {} };
              currentToolInput = "";
              onEvent({
                type: "tool_start",
                data: { toolName: event.content_block.name, toolUseId: event.content_block.id },
              });
            }
            break;

          case "content_block_delta":
            if (event.delta.type === "text_delta") {
              assistantContent += event.delta.text;
              onEvent({ type: "token", data: { text: event.delta.text } });
            } else if (event.delta.type === "input_json_delta") {
              currentToolInput += event.delta.partial_json;
            }
            break;

          case "content_block_stop":
            if (currentToolBlock) {
              try {
                currentToolBlock.input = JSON.parse(currentToolInput || "{}");
              } catch {
                currentToolBlock.input = {};
              }
              toolUseBlocks.push(currentToolBlock as Anthropic.ToolUseBlock);
              currentToolBlock = null;
              currentToolInput = "";
            }
            break;

          case "message_stop":
            break;
        }
      }

      const finalMessage = await stream.finalMessage();

      // If no tool calls, we're done
      if (finalMessage.stop_reason !== "tool_use" || toolUseBlocks.length === 0) {
        // Save assistant message
        if (assistantContent) {
          await createMessage({ conversationId, role: "assistant", content: assistantContent });
        }
        onEvent({ type: "message_complete", data: { content: assistantContent } });
        break;
      }

      // Add assistant turn to messages
      messages.push({ role: "assistant", content: finalMessage.content });

      // Execute all tool calls
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolBlock of toolUseBlocks) {
        const toolCallRecord = await createToolCall({
          conversationId,
          toolName: toolBlock.name,
          input: toolBlock.input as Record<string, unknown>,
        });

        log.info({ toolName: toolBlock.name, input: toolBlock.input }, "Executing tool");

        const output = await executeTool(
          toolBlock.name,
          toolBlock.input as Record<string, unknown>,
          ctx,
        );

        // Track escalation
        if (toolBlock.name === "escalate_to_human" && "success" in output && output.success) {
          escalated = true;
        }

        await updateToolCall(toolCallRecord.id, {
          output: output as Record<string, unknown>,
          status: "error" in output ? "error" : "success",
          errorMessage: "error" in output ? (output as { error: string }).error : undefined,
        });

        onEvent({
          type: "tool_result",
          data: { toolName: toolBlock.name, output },
        });

        toolResults.push({
          type: "tool_result",
          tool_use_id: toolBlock.id,
          content: JSON.stringify(output),
        });
      }

      // Add tool results to messages for next iteration
      messages.push({ role: "user", content: toolResults });
      assistantContent = ""; // reset for next response

      if (iterations >= MAX_TOOL_ITERATIONS) {
        log.warn("Max tool iterations reached — breaking loop");
        onEvent({ type: "error", data: { message: "Maximum steps reached. Please try again or contact support." } });
        break;
      }
    } catch (err) {
      log.error({ err }, "Agent error");
      const message = err instanceof Error ? err.message : "An error occurred";
      onEvent({ type: "error", data: { message } });
      break;
    }
  }

  if (escalated) {
    onEvent({ type: "escalated", data: { message: "Connecting you to a human agent..." } });
  }
}
