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
  Button,
  Divider,
  Box,
  Badge,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { prisma } from "~/lib/db/prisma.server";
import { AnimatedCounter } from "~/components/core";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const store = await prisma.store.findUnique({
    where: { shopDomain: shop },
    include: { subscription: true },
  });
  if (!store) return json({ stats: null, shop });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalOpen, totalPending, resolvedThisMonth, escalated, aiResolved, conversationsUsed] =
    await Promise.all([
      prisma.conversation.count({ where: { storeId: store.id, status: "open" } }),
      prisma.conversation.count({ where: { storeId: store.id, status: "pending" } }),
      prisma.conversation.count({
        where: { storeId: store.id, status: "resolved", resolvedAt: { gte: thirtyDaysAgo } },
      }),
      prisma.conversation.count({
        where: { storeId: store.id, aiHandled: false, status: { in: ["open", "pending"] } },
      }),
      prisma.conversation.count({
        where: { storeId: store.id, aiHandled: true, status: "resolved", resolvedAt: { gte: thirtyDaysAgo } },
      }),
      store.subscription?.conversationsUsed ?? 0,
    ]);

  const aiResolutionRate = resolvedThisMonth > 0 ? Math.round((aiResolved / resolvedThisMonth) * 100) : 0;

  return json({
    stats: {
      totalOpen,
      totalPending,
      resolvedThisMonth,
      escalated,
      aiResolved,
      aiResolutionRate,
      conversationsUsed,
      plan: store.subscription?.plan ?? "starter",
      planStatus: store.subscription?.status ?? "pending",
    },
    shop,
  });
}

export default function Dashboard() {
  const { stats, shop } = useLoaderData<typeof loader>();

  if (!stats) {
    return (
      <Page title="DelivAI Dashboard">
        <Card>
          <Text as="p">Store configuration not found. Please reinstall the app.</Text>
        </Card>
      </Page>
    );
  }

  const planLimit: Record<string, number> = { starter: 500, growth: 2000, scale: Infinity };
  const limit = planLimit[stats.plan] ?? 500;
  const usagePercent = limit === Infinity ? 0 : Math.min((stats.conversationsUsed / limit) * 100, 100);
  const planCapitalized = stats.plan.charAt(0).toUpperCase() + stats.plan.slice(1);

  return (
    <Page
      title="Dashboard"
      subtitle={`${shop} · DelivAI`}
      primaryAction={
        <Button variant="primary" url="/app/inbox">
          View Inbox
        </Button>
      }
      secondaryActions={[{ content: "Settings", url: "/app/settings" }]}
    >
      <BlockStack gap="500">
        {/* Plan status banner */}
        {stats.planStatus !== "active" && (
          <Card>
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="100">
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  {stats.planStatus === "pending"
                    ? "Activate your plan to go live"
                    : `Plan status: ${stats.planStatus}`}
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Your AI assistant is paused until billing is active.
                </Text>
              </BlockStack>
              <Button variant="primary" url="/app/billing">
                Manage Plan
              </Button>
            </InlineStack>
          </Card>
        )}

        {/* Stats row */}
        <Layout>
          <Layout.Section variant="oneThird">
            <StatCard
              label="Open Conversations"
              value={stats.totalOpen}
              tone="attention"
              link="/app/inbox?status=open"
            />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <StatCard
              label="Needs Human Agent"
              value={stats.escalated}
              tone={stats.escalated > 0 ? "critical" : "success"}
              link="/app/inbox?status=open&escalated=true"
            />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <StatCard
              label="AI Resolution Rate"
              value={stats.aiResolutionRate}
              suffix="%"
              tone="success"
              sublabel="This month"
            />
          </Layout.Section>
        </Layout>

        <Layout>
          <Layout.Section variant="oneHalf">
            <StatCard
              label="Resolved This Month"
              value={stats.resolvedThisMonth}
              sublabel={`${stats.aiResolved} by AI`}
            />
          </Layout.Section>
          <Layout.Section variant="oneHalf">
            {/* Usage meter */}
            <Card>
              <BlockStack gap="300">
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    Plan Usage
                  </Text>
                  <Badge tone={stats.planStatus === "active" ? "success" : "attention"}>
                    {`${planCapitalized} · ${stats.planStatus}`}
                  </Badge>
                </InlineStack>
                <Text as="p" variant="headingXl" fontWeight="bold">
                  {stats.conversationsUsed.toLocaleString()}
                  {limit !== Infinity && (
                    <Text as="span" variant="bodyMd" tone="subdued">
                      {" "}/ {limit.toLocaleString()}
                    </Text>
                  )}
                </Text>
                {limit !== Infinity && (
                  <Box
                    background="bg-fill-secondary"
                    borderRadius="full"
                    minHeight="8px"
                    width="100%"
                  >
                    <Box
                      background={usagePercent > 80 ? "bg-fill-caution" : "bg-fill-info"}
                      borderRadius="full"
                      minHeight="8px"
                      width={`${usagePercent}%`}
                    />
                  </Box>
                )}
                {usagePercent > 80 && (
                  <Button variant="plain" url="/app/billing">
                    Upgrade plan →
                  </Button>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <Divider />

        {/* Quick actions */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Quick Actions</Text>
            <InlineStack gap="300" wrap>
              <Button url="/app/inbox">Open Inbox</Button>
              <Button url="/app/settings">Configure AI</Button>
              <Button url="/app/knowledge">Knowledge Base</Button>
              <Button url="/app/guides">Setup Guides</Button>
            </InlineStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  tone?: "attention" | "success" | "critical";
  sublabel?: string;
  link?: string;
}

function StatCard({ label, value, suffix, tone: _tone, sublabel, link }: StatCardProps) {
  return (
    <Card>
      <BlockStack gap="200">
        <Text as="p" variant="bodySm" tone="subdued">
          {label}
        </Text>
        <InlineStack align="start" blockAlign="baseline" gap="100">
          <AnimatedCounter value={value} />
          {suffix && (
            <Text as="span" variant="headingLg">
              {suffix}
            </Text>
          )}
        </InlineStack>
        {sublabel && (
          <Text as="p" variant="bodyXs" tone="subdued">
            {sublabel}
          </Text>
        )}
        {link && (
          <Button variant="plain" url={link}>
            View all →
          </Button>
        )}
      </BlockStack>
    </Card>
  );
}
