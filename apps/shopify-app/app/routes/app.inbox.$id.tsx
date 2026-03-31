import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, Form as RemixForm, useFetcher } from "@remix-run/react";
import type React from "react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Form = RemixForm as React.ComponentType<any>;
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  TextField,
  Select,
  Badge,
  Divider,
  Box,
  Banner,
  EmptyState,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "~/shopify.server";
import { getConversation, updateConversationStatus, createMessage } from "~/lib/db/queries.server";
import { prisma } from "~/lib/db/prisma.server";
import { MessageBubble, StatusBadge, PriorityBadge } from "~/components/core";
import type { Conversation, Message, ToolCall } from "@delivai/shared-types";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const store = await prisma.store.findUnique({ where: { shopDomain: session.shop } });
  if (!store) throw new Response("Store not found", { status: 404 });

  const conversation = await getConversation(params["id"]!, store.id);
  if (!conversation) throw new Response("Conversation not found", { status: 404 });

  const agents = await prisma.agent.findMany({ where: { storeId: store.id } });
  const macros = await prisma.macro.findMany({ where: { storeId: store.id } });

  return json({ conversation, agents, macros });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const store = await prisma.store.findUnique({ where: { shopDomain: session.shop } });
  if (!store) return json({ error: "Store not found" }, { status: 404 });

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  switch (intent) {
    case "reply": {
      const content = formData.get("content") as string;
      const isInternal = formData.get("isInternal") === "true";
      if (!content?.trim()) return json({ error: "Message is required" }, { status: 400 });

      await createMessage({
        conversationId: params["id"]!,
        role: "agent",
        content: content.trim(),
        isInternal,
      });

      // Update status to pending (waiting for customer reply)
      if (!isInternal) {
        await updateConversationStatus(params["id"]!, store.id, "pending");
      }

      return json({ ok: true });
    }

    case "resolve": {
      await updateConversationStatus(params["id"]!, store.id, "resolved");
      return json({ ok: true });
    }

    case "reopen": {
      await updateConversationStatus(params["id"]!, store.id, "open");
      return json({ ok: true });
    }

    case "assign": {
      const agentId = formData.get("agentId") as string;
      await prisma.conversation.update({
        where: { id: params["id"]! },
        data: { assignedAgentId: agentId || null },
      });
      return json({ ok: true });
    }

    default:
      return json({ error: "Unknown intent" }, { status: 400 });
  }
}

export default function ConversationThreadPage() {
  const { conversation, agents, macros } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const FetcherForm = fetcher.Form as React.ComponentType<any>;
  const [replyText, setReplyText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [selectedMacro, setSelectedMacro] = useState("");

  const handleMacroSelect = useCallback(
    (macroId: string) => {
      const macro = macros.find((m) => m.id === macroId);
      if (macro) setReplyText(macro.body);
      setSelectedMacro("");
    },
    [macros],
  );

  const handleSendReply = useCallback(() => {
    if (!replyText.trim()) return;
    fetcher.submit(
      { intent: "reply", content: replyText, isInternal: String(isInternal) },
      { method: "POST" },
    );
    setReplyText("");
  }, [replyText, isInternal, fetcher]);

  const isResolved = conversation.status === "resolved" || conversation.status === "closed";
  const isEscalated = !conversation.aiHandled;
  const assignedAgent = agents.find((a) => a.id === conversation.assignedAgentId);

  // Group messages with their tool calls
  const messagesWithTools = (conversation.messages ?? []).map((msg) => ({
    ...msg,
    toolCalls: (conversation.toolCalls ?? []).filter(
      (tc) => tc.conversationId === conversation.id && tc.createdAt >= msg.createdAt,
    ),
  }));

  return (
    <Page
      title={conversation.customerName ?? conversation.customerEmail ?? "Anonymous Customer"}
      subtitle={`Conversation · ${conversation.id.slice(-6).toUpperCase()}`}
      backAction={{ content: "Inbox", url: "/app/inbox" }}
      primaryAction={
        isResolved ? (
          <Form method="post">
            <input type="hidden" name="intent" value="reopen" />
            <Button submit>Reopen</Button>
          </Form>
        ) : (
          <Form method="post">
            <input type="hidden" name="intent" value="resolve" />
            <Button variant="primary" submit>
              Mark Resolved
            </Button>
          </Form>
        )
      }
    >
      <Layout>
        {/* ── Main thread ── */}
        <Layout.Section>
          <BlockStack gap="400">
            {isEscalated && (
              <Banner tone="warning" title="This conversation needs a human agent">
                <Text as="p">
                  The AI could not resolve this issue. Please review and reply directly.
                </Text>
              </Banner>
            )}

            {/* Messages */}
            <Card>
              <BlockStack gap="0">
                {messagesWithTools.length === 0 ? (
                  <EmptyState heading="No messages yet" image="">
                    <Text as="p">Waiting for the customer to send a message.</Text>
                  </EmptyState>
                ) : (
                  <Box padding="400">
                    <BlockStack gap="400">
                      {messagesWithTools.map((msg) => (
                        <MessageBubble
                          key={msg.id}
                          message={msg as unknown as Message}
                          toolCalls={msg.toolCalls as unknown as ToolCall[]}
                          agentName={assignedAgent?.name}
                        />
                      ))}
                    </BlockStack>
                  </Box>
                )}
              </BlockStack>
            </Card>

            {/* Reply composer */}
            {!isResolved && (
              <Card>
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h3" variant="headingSm">
                      {isInternal ? "Internal Note" : "Reply to Customer"}
                    </Text>
                    <Button
                      variant="plain"
                      onClick={() => setIsInternal(!isInternal)}
                    >
                      {isInternal ? "Switch to reply" : "Add internal note"}
                    </Button>
                  </InlineStack>

                  {macros.length > 0 && (
                    <Select
                      label="Use macro"
                      labelHidden
                      options={[
                        { label: "Insert a macro...", value: "" },
                        ...macros.map((m) => ({ label: m.name, value: m.id })),
                      ]}
                      value={selectedMacro}
                      onChange={handleMacroSelect}
                    />
                  )}

                  <TextField
                    label="Message"
                    labelHidden
                    value={replyText}
                    onChange={setReplyText}
                    multiline={4}
                    autoComplete="off"
                    placeholder={
                      isInternal
                        ? "Add a note visible only to your team..."
                        : "Type your reply to the customer..."
                    }
                  />

                  <InlineStack align="end" gap="200">
                    <Button onClick={handleSendReply} variant="primary" disabled={!replyText.trim()}>
                      {isInternal ? "Add Note" : "Send Reply"}
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Layout.Section>

        {/* ── Sidebar ── */}
        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            {/* Status & Priority */}
            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingSm">Status</Text>
                <InlineStack gap="200">
                  <StatusBadge status={conversation.status as "open" | "pending" | "resolved" | "closed"} />
                  <PriorityBadge priority={conversation.priority as "low" | "medium" | "high" | "urgent"} />
                </InlineStack>
                <Divider />
                <Text as="p" variant="bodyXs" tone="subdued">
                  Created {new Date(conversation.createdAt).toLocaleDateString()}
                </Text>
                {conversation.resolvedAt && (
                  <Text as="p" variant="bodyXs" tone="subdued">
                    Resolved {new Date(conversation.resolvedAt).toLocaleDateString()}
                  </Text>
                )}
              </BlockStack>
            </Card>

            {/* Customer info */}
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">Customer</Text>
                {conversation.customerName && (
                  <Text as="p" variant="bodyMd">{conversation.customerName}</Text>
                )}
                {conversation.customerEmail && (
                  <Text as="p" variant="bodyMd" tone="subdued">{conversation.customerEmail}</Text>
                )}
                {!conversation.customerName && !conversation.customerEmail && (
                  <Text as="p" variant="bodyMd" tone="subdued">Anonymous</Text>
                )}
                <Text as="p" variant="bodyXs" tone="subdued">
                  {conversation.aiHandled ? "AI handled" : "Human agent"}
                </Text>
              </BlockStack>
            </Card>

            {/* Assign agent */}
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">Assigned Agent</Text>
                <FetcherForm method="post">
                  <input type="hidden" name="intent" value="assign" />
                  <Select
                    label="Agent"
                    labelHidden
                    options={[
                      { label: "Unassigned", value: "" },
                      ...agents.map((a) => ({ label: a.name, value: a.id })),
                    ]}
                    value={conversation.assignedAgentId ?? ""}
                    onChange={(v) => {
                      fetcher.submit(
                        { intent: "assign", agentId: v },
                        { method: "POST" },
                      );
                    }}
                  />
                </FetcherForm>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
