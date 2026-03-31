import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  DataTable,
  Badge,
} from "@shopify/polaris";

import { authenticate } from "~/shopify.server";
import { prisma } from "~/lib/db/prisma.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  const [totalConversations, resolvedConversations, escalatedConversations, recentConversations] =
    await Promise.all([
      prisma.conversation.count({ where: { store: { shopDomain: session.shop } } }),
      prisma.conversation.count({
        where: { store: { shopDomain: session.shop }, status: "resolved" },
      }),
      prisma.conversation.count({
        where: { store: { shopDomain: session.shop }, escalatedAt: { not: null } },
      }),
      prisma.conversation.findMany({
        where: { store: { shopDomain: session.shop } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          status: true,
          priority: true,
          aiHandled: true,
          createdAt: true,
          customerEmail: true,
          escalatedAt: true,
        },
      }),
    ]);

  const aiResolutionRate =
    totalConversations > 0
      ? Math.round(((resolvedConversations - escalatedConversations) / totalConversations) * 100)
      : 0;

  return json({
    totalConversations,
    resolvedConversations,
    escalatedConversations,
    aiResolutionRate,
    recentConversations,
  });
}

export default function AnalyticsPage() {
  const { totalConversations, resolvedConversations, escalatedConversations, aiResolutionRate, recentConversations } =
    useLoaderData<typeof loader>();

  const rows = recentConversations.map((c) => [
    c.customerEmail ?? "Anonymous",
    c.status,
    c.priority,
    c.aiHandled ? "AI" : "Human",
    new Date(c.createdAt).toLocaleDateString(),
  ]);

  return (
    <Page title="Analytics" subtitle="Conversation metrics and AI performance">
      <BlockStack gap="500">
        <Layout>
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">Total Conversations</Text>
                <Text as="p" variant="heading2xl" fontWeight="bold">{totalConversations.toLocaleString()}</Text>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">Resolved</Text>
                <Text as="p" variant="heading2xl" fontWeight="bold">{resolvedConversations.toLocaleString()}</Text>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">AI Resolution Rate</Text>
                <InlineStack gap="200" blockAlign="center">
                  <Text as="p" variant="heading2xl" fontWeight="bold">{aiResolutionRate}%</Text>
                  <Badge tone={aiResolutionRate >= 70 ? "success" : "attention"}>
                    {aiResolutionRate >= 70 ? "Good" : aiResolutionRate >= 40 ? "Fair" : "Needs attention"}
                  </Badge>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Recent Conversations</Text>
            {rows.length > 0 ? (
              <DataTable
                columnContentTypes={["text", "text", "text", "text", "text"]}
                headings={["Customer", "Status", "Priority", "Handled by", "Date"]}
                rows={rows}
              />
            ) : (
              <Text as="p" variant="bodyMd" tone="subdued">No conversations yet. Install the chat widget to get started.</Text>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
