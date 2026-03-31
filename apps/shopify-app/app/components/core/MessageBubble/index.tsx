import { Box, Text, InlineStack, Avatar } from "@shopify/polaris";
import type { Message, ToolCall } from "@delivai/shared-types";

interface MessageBubbleProps {
  message: Message;
  toolCalls?: ToolCall[];
  agentName?: string;
}

export function MessageBubble({ message, toolCalls = [], agentName }: MessageBubbleProps) {
  const isCustomer = message.role === "customer";
  const isInternal = message.isInternal;

  return (
    <Box
      paddingBlockEnd="200"
    >
      <InlineStack
        gap="200"
        align={isCustomer ? "end" : "start"}
        blockAlign="start"
      >
        {!isCustomer && (
          <Avatar
            size="sm"
            name={message.role === "assistant" ? "AI" : (agentName ?? "Agent")}
            initials={message.role === "assistant" ? "AI" : (agentName?.[0] ?? "A")}
          />
        )}

        <Box
          background={
            isInternal
              ? "bg-fill-warning"
              : isCustomer
                ? "bg-fill-brand"
                : "bg-fill-secondary"
          }
          paddingBlock="200"
          paddingInline="300"
          borderRadius="200"
          maxWidth="70%"
        >
          {isInternal && (
            <Text as="p" variant="bodySm" tone="caution" fontWeight="semibold">
              Internal note
            </Text>
          )}
          <Text
            as="p"
            variant="bodyMd"
            tone={isCustomer ? undefined : undefined}
          >
            {message.content}
          </Text>
          <Text as="p" variant="bodyXs" tone="subdued">
            {new Date(message.createdAt).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </Box>

        {isCustomer && <Avatar size="sm" name="Customer" initials="C" />}
      </InlineStack>

      {/* Tool call cards */}
      {toolCalls.map((tc) => (
        <ToolCallCard key={tc.id} toolCall={tc} />
      ))}
    </Box>
  );
}

interface ToolCallCardProps {
  toolCall: ToolCall;
}

function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const labelMap: Record<string, string> = {
    get_order: "Order Lookup",
    get_tracking: "Tracking Check",
    cancel_order: "Order Cancellation",
    create_refund: "Refund Initiated",
    rebook_delivery: "Delivery Rebooked",
    search_knowledge: "Knowledge Search",
    escalate_to_human: "Escalated to Human",
  };

  const iconMap: Record<string, string> = {
    get_order: "📦",
    get_tracking: "🚚",
    cancel_order: "❌",
    create_refund: "💰",
    rebook_delivery: "🔄",
    search_knowledge: "🔍",
    escalate_to_human: "👤",
  };

  const statusTone = toolCall.status === "success" ? "success" : "critical";
  const output = toolCall.output as Record<string, unknown> | null;

  return (
    <Box paddingBlockStart="100">
      <Box paddingInlineStart="1200">
        <Box
          background="bg-fill-secondary"
          borderWidth="025"
          borderColor="border"
          borderRadius="150"
          padding="300"
        >
          <InlineStack gap="200" align="start" blockAlign="center">
            <Text as="span" variant="bodyMd">{iconMap[toolCall.toolName] ?? "⚙️"}</Text>
            <Text as="span" variant="bodySm" fontWeight="semibold">
              {labelMap[toolCall.toolName] ?? toolCall.toolName}
            </Text>
            <Text as="span" variant="bodyXs" tone={statusTone}>
              {toolCall.status}
            </Text>
          </InlineStack>

          {output && "error" in output && (
            <Text as="p" variant="bodyXs" tone="critical">
              {String(output.error)}
            </Text>
          )}

          {output && "name" in output && (
            <Box paddingBlockStart="100">
              <Text as="p" variant="bodyXs">
                Order {String(output.name)} · {String(output.status)} · {String(output.total)} {String(output.currency)}
              </Text>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
