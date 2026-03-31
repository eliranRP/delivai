import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSearchParams, useNavigate } from "@remix-run/react";
import {
  Page,
  Tabs,
  ResourceList,
  Card,
  EmptyState,
  Button,
  InlineStack,
  Filters,
  ChoiceList,
  Text,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "~/shopify.server";
import { listConversations } from "~/lib/db/queries.server";
import { prisma } from "~/lib/db/prisma.server";
import { ConversationCard } from "~/components/core";
import type { ConversationStatus } from "@delivai/shared-types";

const STATUS_TABS: Array<{ id: ConversationStatus | "all" | "escalated"; content: string }> = [
  { id: "all", content: "All" },
  { id: "open", content: "Open" },
  { id: "pending", content: "Pending" },
  { id: "resolved", content: "Resolved" },
  { id: "escalated", content: "Needs Agent" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const status = (url.searchParams.get("status") ?? "all") as ConversationStatus | "all";
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);

  const store = await prisma.store.findUnique({ where: { shopDomain: session.shop } });
  if (!store) return json({ conversations: [], total: 0, page: 1, pageSize: 25 });

  // Special case: escalated = aiHandled: false + open/pending
  if (status === "escalated" as string) {
    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: { storeId: store.id, aiHandled: false, status: { in: ["open", "pending"] } },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * 25,
        take: 25,
        include: {
          tags: { include: { tag: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      }),
      prisma.conversation.count({
        where: { storeId: store.id, aiHandled: false, status: { in: ["open", "pending"] } },
      }),
    ]);
    return json({ conversations, total, page, pageSize: 25 });
  }

  const result = await listConversations(store.id, { status, page });
  return json(result);
}

export default function InboxPage() {
  const { conversations, total, page, pageSize } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [queryValue, setQueryValue] = useState("");

  const currentStatus = searchParams.get("status") ?? "all";
  const activeTab = STATUS_TABS.findIndex((t) => t.id === currentStatus);

  const handleTabChange = useCallback(
    (tabIndex: number) => {
      const tab = STATUS_TABS[tabIndex];
      if (tab) navigate(`/app/inbox?status=${tab.id}`);
    },
    [navigate],
  );

  const handleSelectConversation = useCallback(
    (id: string) => navigate(`/app/inbox/${id}`),
    [navigate],
  );

  const promotedBulkActions = [
    {
      content: "Mark resolved",
      onAction: () => {
        // TODO: bulk resolve
        setSelectedItems([]);
      },
    },
    {
      content: "Assign to me",
      onAction: () => {
        setSelectedItems([]);
      },
    },
  ];

  const filterControl = (
    <Filters
      queryValue={queryValue}
      filters={[
        {
          key: "priority",
          label: "Priority",
          filter: (
            <ChoiceList
              title="Priority"
              titleHidden
              choices={[
                { label: "Urgent", value: "urgent" },
                { label: "High", value: "high" },
                { label: "Medium", value: "medium" },
                { label: "Low", value: "low" },
              ]}
              selected={[]}
              onChange={() => {}}
            />
          ),
        },
      ]}
      onQueryChange={setQueryValue}
      onQueryClear={() => setQueryValue("")}
      onClearAll={() => setQueryValue("")}
    />
  );

  const isEmpty = conversations.length === 0;

  return (
    <Page
      title="Inbox"
      subtitle={`${total} conversation${total !== 1 ? "s" : ""}`}
      primaryAction={
        <Button variant="primary" url="/app/inbox" disabled>
          Refresh
        </Button>
      }
    >
      <Card padding="0">
        <Tabs tabs={STATUS_TABS} selected={activeTab >= 0 ? activeTab : 0} onSelect={handleTabChange} />

        {isEmpty ? (
          <EmptyState
            heading="No conversations yet"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            action={{ content: "Configure widget", url: "/app/settings" }}
          >
            <Text as="p">
              Install the chat widget on your store to start receiving customer messages.
            </Text>
          </EmptyState>
        ) : (
          <ResourceList
            resourceName={{ singular: "conversation", plural: "conversations" }}
            items={conversations}
            renderItem={(conversation) => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation as unknown as Parameters<typeof ConversationCard>[0]["conversation"]}
                variant="expanded"
                onSelect={handleSelectConversation}
              />
            )}
            selectedItems={selectedItems}
            onSelectionChange={(items) =>
              setSelectedItems(typeof items === "string" ? [] : (items as string[]))
            }
            promotedBulkActions={promotedBulkActions}
            filterControl={filterControl}
            pagination={{
              hasPrevious: page > 1,
              hasNext: page * pageSize < total,
              onPrevious: () => navigate(`/app/inbox?status=${currentStatus}&page=${page - 1}`),
              onNext: () => navigate(`/app/inbox?status=${currentStatus}&page=${page + 1}`),
            }}
          />
        )}
      </Card>
    </Page>
  );
}
