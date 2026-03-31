import { Badge } from "@shopify/polaris";
import type { BadgeProps } from "@shopify/polaris";
import type { ConversationStatus, ConversationPriority } from "@delivai/shared-types";

const STATUS_TONE: Record<ConversationStatus, BadgeProps["tone"]> = {
  open: "attention",
  pending: "warning",
  resolved: "success",
  closed: undefined,
};

const STATUS_LABEL: Record<ConversationStatus, string> = {
  open: "Open",
  pending: "Pending",
  resolved: "Resolved",
  closed: "Closed",
};

const PRIORITY_TONE: Record<ConversationPriority, BadgeProps["tone"]> = {
  low: undefined,
  medium: "info",
  high: "warning",
  urgent: "critical",
};

interface StatusBadgeProps {
  status: ConversationStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>;
}

interface PriorityBadgeProps {
  priority: ConversationPriority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const label = priority.charAt(0).toUpperCase() + priority.slice(1);
  return <Badge tone={PRIORITY_TONE[priority]}>{label}</Badge>;
}
