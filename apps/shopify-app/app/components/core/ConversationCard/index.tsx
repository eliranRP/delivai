import {
  ResourceItem,
  Text,
  InlineStack,
  BlockStack,
  Box,
  Avatar,
} from "@shopify/polaris";
import { StatusBadge, PriorityBadge } from "../StatusBadge";
import type { Conversation } from "@delivai/shared-types";

export interface ConversationCardAction {
  label: string;
  onAction: (id: string) => void;
}

export interface ConversationCardProps {
  conversation: Omit<Conversation, "tags"> & {
    messages?: Array<{ content: string; createdAt: Date }>;
    tags?: Array<{ tag: { name: string; color: string } }>;
  };
  variant?: "compact" | "expanded";
  actions?: ConversationCardAction[];
  onSelect?: (id: string) => void;
  selected?: boolean;
}

export function ConversationCard({
  conversation,
  variant = "compact",
  onSelect,
}: ConversationCardProps) {
  const lastMessage = conversation.messages?.[0];
  const preview = lastMessage?.content?.slice(0, 80) ?? "No messages yet";
  const customerLabel = conversation.customerName ?? conversation.customerEmail ?? "Anonymous";
  const timeAgo = formatTimeAgo(conversation.updatedAt);
  const isEscalated = !conversation.aiHandled;

  return (
    <ResourceItem
      id={conversation.id}
      onClick={() => onSelect?.(conversation.id)}
      accessibilityLabel={`Conversation with ${customerLabel}`}
    >
      <InlineStack gap="400" align="start" blockAlign="start" wrap={false}>
        <Avatar size="sm" name={customerLabel} initials={customerLabel.charAt(0).toUpperCase()} />

        <Box minWidth="0" width="100%">
          <InlineStack align="space-between" blockAlign="center">
            <Text as="span" variant="bodyMd" fontWeight="semibold" truncate>
              {customerLabel}
            </Text>
            <Text as="span" variant="bodyXs" tone="subdued">
              {timeAgo}
            </Text>
          </InlineStack>

          {variant === "expanded" && (
            <Text as="p" variant="bodyXs" tone="subdued" truncate>
              {preview}
            </Text>
          )}

          <InlineStack gap="150" blockAlign="center" wrap={false}>
            <StatusBadge status={conversation.status as "open" | "pending" | "resolved" | "closed"} />
            <PriorityBadge priority={conversation.priority as "low" | "medium" | "high" | "urgent"} />
            {isEscalated && (
              <Text as="span" variant="bodyXs" tone="caution" fontWeight="semibold">
                Needs agent
              </Text>
            )}
            {conversation.aiHandled && (
              <Text as="span" variant="bodyXs" tone="success">
                AI
              </Text>
            )}
          </InlineStack>

          {/* Tags */}
          {conversation.tags && conversation.tags.length > 0 && (
            <BlockStack gap="050">
              <InlineStack gap="100" wrap>
                {conversation.tags.slice(0, 3).map((ct) => (
                  <Box
                    key={ct.tag.name}
                    background="bg-fill-secondary"
                    paddingBlock="050"
                    paddingInline="150"
                    borderRadius="full"
                  >
                    <Text as="span" variant="bodyXs">
                      {ct.tag.name}
                    </Text>
                  </Box>
                ))}
              </InlineStack>
            </BlockStack>
          )}
        </Box>
      </InlineStack>
    </ResourceItem>
  );
}

function formatTimeAgo(date: Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
