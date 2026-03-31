import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
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
  Divider,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { PLAN_AMOUNTS } from "~/lib/billing-plans";
import { prisma } from "~/lib/db/prisma.server";

const PLAN_FEATURES: Record<string, string[]> = {
  starter: [
    "500 AI conversations/month",
    "2 human agents",
    "Chat widget",
    "AI delivery tracking",
    "Basic inbox",
    "14-day free trial",
  ],
  growth: [
    "2,000 AI conversations/month",
    "10 human agents",
    "Everything in Starter",
    "Order cancellation & refunds",
    "EasyPost delivery rebook",
    "Macros & saved replies",
    "14-day free trial",
  ],
  scale: [
    "Unlimited AI conversations",
    "Unlimited agents",
    "Everything in Growth",
    "SLA management",
    "Analytics & reporting",
    "Custom AI persona",
    "Priority support",
    "14-day free trial",
  ],
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const store = await prisma.store.findUnique({
    where: { shopDomain: session.shop },
    include: { subscription: true },
  });

  return json({
    currentPlan: store?.subscription?.plan ?? "starter",
    planStatus: store?.subscription?.status ?? "pending",
    conversationsUsed: store?.subscription?.conversationsUsed ?? 0,
    trialEndsAt: store?.subscription?.trialEndsAt,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session, billing } = await authenticate.admin(request);
  const formData = await request.formData();
  const planName = formData.get("plan") as "starter" | "growth" | "scale";

  try {
    await billing.require({
      plans: [planName],
      isTest: process.env.NODE_ENV !== "production",
      onFailure: async () => {
        const { confirmationUrl } = await billing.request({
          plan: planName,
          isTest: process.env.NODE_ENV !== "production",
          returnUrl: `https://${session.shop}/admin/apps/delivai/app/billing`,
        });
        return redirect(confirmationUrl);
      },
    });
  } catch (err) {
    if (err instanceof Response) throw err;
    // Already on correct plan
  }

  return redirect("/app/billing");
}

export default function BillingPage() {
  const { currentPlan, planStatus, conversationsUsed, trialEndsAt } = useLoaderData<typeof loader>();

  const planOrder: Array<"starter" | "growth" | "scale"> = ["starter", "growth", "scale"];
  const currentIndex = planOrder.indexOf(currentPlan as "starter" | "growth" | "scale");

  return (
    <Page title="Plan & Billing" subtitle="Manage your DelivAI subscription">
      <BlockStack gap="500">
        {planStatus === "active" && trialEndsAt && new Date(trialEndsAt) > new Date() && (
          <Banner tone="info" title={`Trial ends ${new Date(trialEndsAt).toLocaleDateString()}`}>
            <Text as="p">You're on a free trial. No charges until your trial ends.</Text>
          </Banner>
        )}

        {planStatus === "frozen" && (
          <Banner tone="warning" title="Your plan is frozen">
            <Text as="p">Your subscription has been paused. Please update your payment method in Shopify.</Text>
          </Banner>
        )}

        <Layout>
          {planOrder.map((plan, idx) => {
            const isCurrent = plan === currentPlan;
            const isDowngrade = idx < currentIndex;
            const price = PLAN_AMOUNTS[plan];
            const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);

            return (
              <Layout.Section key={plan} variant="oneThird">
                <Card>
                  <BlockStack gap="400">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="h2" variant="headingLg">{planLabel}</Text>
                      {isCurrent && (
                        <Badge tone={planStatus === "active" ? "success" : "attention"}>
                          {planStatus === "active" ? "Current plan" : planStatus}
                        </Badge>
                      )}
                      {plan === "growth" && !isCurrent && (
                        <Badge tone="info">Most popular</Badge>
                      )}
                    </InlineStack>

                    <InlineStack blockAlign="baseline" gap="100">
                      <Text as="span" variant="headingXl" fontWeight="bold">
                        ${price}
                      </Text>
                      <Text as="span" variant="bodyMd" tone="subdued">/month</Text>
                    </InlineStack>

                    <Divider />

                    <List type="bullet" gap="loose">
                      {PLAN_FEATURES[plan]?.map((f) => (
                        <List.Item key={f}>{f}</List.Item>
                      ))}
                    </List>

                    {isCurrent ? (
                      <Button disabled fullWidth>
                        {planStatus === "active" ? "Current Plan" : "Activate"}
                      </Button>
                    ) : (
                      <form method="post">
                        <input type="hidden" name="plan" value={plan} />
                        <Button variant={plan === "growth" ? "primary" : undefined} submit fullWidth>
                          {isDowngrade ? "Downgrade" : "Upgrade"} to {planLabel}
                        </Button>
                      </form>
                    )}
                  </BlockStack>
                </Card>
              </Layout.Section>
            );
          })}
        </Layout>

        <Card>
          <InlineStack align="space-between" blockAlign="center">
            <BlockStack gap="100">
              <Text as="p" variant="bodyMd" fontWeight="semibold">
                Current usage this month
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                {conversationsUsed.toLocaleString()} conversations used
              </Text>
            </BlockStack>
            <Text as="p" variant="bodyXs" tone="subdued">
              Resets on the 1st of each month
            </Text>
          </InlineStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
