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
  Badge,
  List,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { prisma } from "~/lib/db/prisma.server";

const GUIDES = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Install the widget, sync your catalog, and go live in under 5 minutes.",
    time: "5 min",
    steps: [
      "Install DelivAI from the Shopify App Store",
      "Your store catalog syncs automatically on install",
      "Go to Settings → Chat Widget → copy the widget color to match your brand",
      "Open your Shopify Theme Editor → Add section → Apps → Enable DelivAI Chat",
      "Test the widget on your storefront",
    ],
    icon: "🚀",
  },
  {
    id: "claude-api-key",
    title: "Set Up Your Claude API Key",
    description: "Connect your Anthropic account to power the AI assistant.",
    time: "3 min",
    steps: [
      "Go to console.anthropic.com and sign in (or create an account)",
      "Navigate to API Keys → Create new key",
      "Copy the key (starts with sk-ant-...)",
      "In DelivAI Settings → AI Configuration → paste your key",
      "Click Save — your key is encrypted and stored securely",
      "Send a test message in the widget preview to verify it works",
    ],
    icon: "🔑",
  },
  {
    id: "easypost-setup",
    title: "Connect EasyPost for Tracking",
    description: "Enable real-time delivery tracking and rebook failed shipments.",
    time: "5 min",
    steps: [
      "Sign up at easypost.com (free tier available)",
      "Go to your EasyPost dashboard → API Keys",
      "Copy your Production API key (starts with EZT...)",
      "In DelivAI Settings → AI Configuration → EasyPost API Key",
      "The AI will now use EasyPost for all tracking queries",
    ],
    icon: "🚚",
  },
  {
    id: "inbox-management",
    title: "Managing Your Inbox",
    description: "Handle escalated conversations and collaborate with your team.",
    time: "4 min",
    steps: [
      "Open DelivAI → Inbox to see all customer conversations",
      "Use tabs to filter: Open, Pending, Resolved, Needs Agent",
      "Click any conversation to open the thread",
      "Reply directly to customers or add internal notes",
      "Use macros (saved replies) to respond quickly",
      "Assign conversations to team members",
      "Mark resolved when the issue is closed",
    ],
    icon: "📬",
  },
  {
    id: "ai-actions",
    title: "Understanding AI Actions",
    description: "Learn what your AI assistant can and cannot do.",
    time: "3 min",
    steps: [
      "Track delivery: AI reads EasyPost tracking for real-time status",
      "Cancel order: AI cancels unfulfilled orders after customer confirmation",
      "Refund: AI initiates full or partial refunds directly in Shopify",
      "Rebook delivery: AI updates shipping address via EasyPost",
      "Escalate: AI hands off complex issues to your human agents",
      "Note: AI always confirms destructive actions (cancel/refund) before executing",
    ],
    icon: "🤖",
  },
  {
    id: "billing",
    title: "Billing & Plans",
    description: "Understand your plan limits and how to upgrade.",
    time: "2 min",
    steps: [
      "Starter ($29/mo): 500 conversations, 2 agents — ideal for new stores",
      "Growth ($79/mo): 2,000 conversations, 10 agents, all AI actions",
      "Scale ($199/mo): Unlimited conversations and agents",
      "All plans include a 14-day free trial",
      "Upgrade at any time from Settings → Billing",
      "Conversations reset on the 1st of each month",
    ],
    icon: "💳",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const store = await prisma.store.findUnique({
    where: { shopDomain: session.shop },
    include: { aiConfig: true, subscription: true },
  });

  return json({
    completedSetup: {
      hasClaudeKey: Boolean(store?.aiConfig?.claudeApiKey),
      hasEasyPostKey: Boolean(store?.aiConfig?.easyPostApiKey),
      hasPlan: store?.subscription?.status === "active",
    },
  });
}

export default function GuidesPage() {
  const { completedSetup } = useLoaderData<typeof loader>();

  const setupSteps = [
    { label: "Add Claude API Key", done: completedSetup.hasClaudeKey, url: "/app/settings" },
    { label: "Activate billing plan", done: completedSetup.hasPlan, url: "/app/billing" },
    {
      label: "Add EasyPost API Key (optional)",
      done: completedSetup.hasEasyPostKey,
      url: "/app/settings",
    },
  ];

  const allDone = setupSteps.filter(s => !s.done).length === 0;

  return (
    <Page title="Setup Guides" subtitle="Get DelivAI running in under 5 minutes">
      <Layout>
        <Layout.Section variant="oneHalf">
          <BlockStack gap="400">
            {!allDone && (
              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">
                    Quick Setup Checklist
                  </Text>
                  {setupSteps.map((step) => (
                    <InlineStack key={step.label} align="space-between" blockAlign="center">
                      <InlineStack gap="200" blockAlign="center">
                        <Text as="span" variant="bodyMd">
                          {step.done ? "✅" : "⬜"}
                        </Text>
                        <Text as="p" variant="bodyMd" tone={step.done ? "success" : undefined}>
                          {step.label}
                        </Text>
                      </InlineStack>
                      {!step.done && (
                        <Button variant="plain" url={step.url}>
                          Set up →
                        </Button>
                      )}
                    </InlineStack>
                  ))}
                </BlockStack>
              </Card>
            )}

            {allDone && (
              <Card background="bg-fill-success">
                <InlineStack gap="300" blockAlign="center">
                  <Text as="span" variant="headingLg">🎉</Text>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      Setup complete!
                    </Text>
                    <Text as="p" variant="bodyMd">
                      Your AI assistant is live and ready to help customers.
                    </Text>
                  </BlockStack>
                </InlineStack>
              </Card>
            )}

            {GUIDES.map((guide) => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">Need Help?</Text>
              <Text as="p" tone="subdued">
                Can't find what you need? Our team is here to help.
              </Text>
              <Button url="mailto:support@delivai.com">Email Support</Button>
              <Button url="https://delivai.com/docs" external>
                View Documentation
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

interface GuideCardProps {
  guide: (typeof GUIDES)[number];
}

function GuideCard({ guide }: GuideCardProps) {
  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack gap="200" blockAlign="center">
            <Text as="span" variant="headingLg">{guide.icon}</Text>
            <BlockStack gap="050">
              <Text as="h3" variant="headingMd">{guide.title}</Text>
              <Text as="p" variant="bodyMd" tone="subdued">{guide.description}</Text>
            </BlockStack>
          </InlineStack>
          <Badge>{guide.time}</Badge>
        </InlineStack>

        <List type="bullet" gap="loose">
          {guide.steps.map((step, i) => (
            <List.Item key={i}>{step}</List.Item>
          ))}
        </List>
      </BlockStack>
    </Card>
  );
}
