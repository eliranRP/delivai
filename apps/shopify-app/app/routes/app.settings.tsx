import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import type React from "react";
import {
  Page,
  Tabs,
  Card,
  BlockStack,
  InlineStack,
  Text,
  TextField,
  Button,
  Select,
  Checkbox,
  Banner,
  Badge,
  Divider,
  Form,
  FormLayout,
  RangeSlider,
  ColorPicker,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "~/shopify.server";
import { prisma } from "~/lib/db/prisma.server";
import { encrypt, decrypt, maskApiKey } from "~/lib/crypto/encryption.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const store = await prisma.store.findUnique({
    where: { shopDomain: session.shop },
    include: { aiConfig: true },
  });

  const aiConfig = store?.aiConfig;
  return json({
    shop: session.shop,
    config: aiConfig
      ? {
          claudeApiKeyMasked: aiConfig.claudeApiKey ? maskApiKey(decrypt(aiConfig.claudeApiKey)) : "",
          easyPostApiKeyMasked: aiConfig.easyPostApiKey
            ? maskApiKey(decrypt(aiConfig.easyPostApiKey))
            : "",
          systemPromptOverride: aiConfig.systemPromptOverride ?? "",
          autoEscalateThreshold: aiConfig.autoEscalateThreshold,
          greetingMessage: aiConfig.greetingMessage,
          widgetColor: aiConfig.widgetColor,
          widgetPosition: aiConfig.widgetPosition,
          collectEmailUpfront: aiConfig.collectEmailUpfront,
          aiPersonaName: aiConfig.aiPersonaName,
          hasClaudeKey: Boolean(aiConfig.claudeApiKey),
          hasEasyPostKey: Boolean(aiConfig.easyPostApiKey),
        }
      : null,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const store = await prisma.store.findUnique({ where: { shopDomain: session.shop } });
  if (!store) return json({ error: "Store not found" }, { status: 404 });

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  const updateData: Record<string, unknown> = {};

  switch (intent) {
    case "save_ai": {
      const claudeApiKey = formData.get("claudeApiKey") as string;
      const easyPostApiKey = formData.get("easyPostApiKey") as string;
      const systemPrompt = formData.get("systemPromptOverride") as string;
      const threshold = parseFloat(formData.get("autoEscalateThreshold") as string);
      const personaName = formData.get("aiPersonaName") as string;

      if (claudeApiKey && claudeApiKey !== "••••••••") {
        updateData.claudeApiKey = encrypt(claudeApiKey);
      }
      if (easyPostApiKey && easyPostApiKey !== "••••••••") {
        updateData.easyPostApiKey = encrypt(easyPostApiKey);
      }
      if (systemPrompt !== undefined) updateData.systemPromptOverride = systemPrompt || null;
      if (!isNaN(threshold)) updateData.autoEscalateThreshold = threshold;
      if (personaName) updateData.aiPersonaName = personaName;
      break;
    }

    case "save_widget": {
      updateData.widgetColor = formData.get("widgetColor") as string;
      updateData.widgetPosition = formData.get("widgetPosition") as string;
      updateData.greetingMessage = formData.get("greetingMessage") as string;
      updateData.collectEmailUpfront = formData.get("collectEmailUpfront") === "true";
      break;
    }
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.aIConfig.upsert({
      where: { storeId: store.id },
      create: {
        storeId: store.id,
        claudeApiKey: updateData.claudeApiKey as string ?? "",
        ...updateData,
      },
      update: updateData,
    });
  }

  return json({ ok: true, saved: true });
}

const SETTINGS_TABS = [
  { id: "ai", content: "AI Configuration" },
  { id: "widget", content: "Chat Widget" },
  { id: "team", content: "Team" },
];

export default function SettingsPage() {
  const { config, shop } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const [activeTab, setActiveTab] = useState(0);

  const saved = fetcher.data && "saved" in fetcher.data && fetcher.data.saved;

  return (
    <Page title="Settings" subtitle="Configure your AI assistant and chat widget">
      {saved && <Banner tone="success" title="Settings saved" onDismiss={() => {}} />}

      <Tabs tabs={SETTINGS_TABS} selected={activeTab} onSelect={setActiveTab}>
        {activeTab === 0 && <AISettingsTab config={config} fetcher={fetcher} />}
        {activeTab === 1 && <WidgetSettingsTab config={config} shop={shop} fetcher={fetcher} />}
        {activeTab === 2 && <TeamSettingsTab />}
      </Tabs>
    </Page>
  );
}

function AISettingsTab({
  config,
  fetcher,
}: {
  config: ReturnType<typeof useLoaderData<typeof loader>>["config"];
  fetcher: ReturnType<typeof useFetcher>;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const FetcherForm = fetcher.Form as React.ComponentType<any>;
  const [claudeKey, setClaudeKey] = useState("");
  const [easyPostKey, setEasyPostKey] = useState("");
  const [personaName, setPersonaName] = useState(config?.aiPersonaName ?? "Aria");
  const [systemPrompt, setSystemPrompt] = useState(config?.systemPromptOverride ?? "");
  const [threshold, setThreshold] = useState<number[]>([
    Math.round((config?.autoEscalateThreshold ?? 0.4) * 100),
  ]);

  return (
    <Card>
      <FetcherForm method="post">
        <input type="hidden" name="intent" value="save_ai" />
        <BlockStack gap="500">
          <BlockStack gap="300">
            <Text as="h3" variant="headingMd">Claude API Key (BYOK)</Text>
            <Text as="p" variant="bodyMd" tone="subdued">
              Your API key is encrypted at rest. Each conversation uses your key — you control costs directly.
            </Text>
            <InlineStack gap="200" blockAlign="end">
              <div style={{ flex: 1 }}>
                <TextField
                  label="Claude API Key"
                  name="claudeApiKey"
                  type="password"
                  value={claudeKey}
                  onChange={setClaudeKey}
                  placeholder={config?.hasClaudeKey ? config.claudeApiKeyMasked : "sk-ant-api03-..."}
                  autoComplete="off"
                  helpText={
                    config?.hasClaudeKey
                      ? "API key configured. Enter a new key to update it."
                      : "Required to enable the AI assistant."
                  }
                />
              </div>
              {config?.hasClaudeKey && (
                <Badge tone="success">Active</Badge>
              )}
            </InlineStack>
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingMd">EasyPost API Key</Text>
            <Text as="p" variant="bodyMd" tone="subdued">
              Required for real-time delivery tracking and rebooking. Get your key at easypost.com.
            </Text>
            <InlineStack gap="200" blockAlign="end">
              <div style={{ flex: 1 }}>
                <TextField
                  label="EasyPost API Key"
                  name="easyPostApiKey"
                  type="password"
                  value={easyPostKey}
                  onChange={setEasyPostKey}
                  placeholder={config?.hasEasyPostKey ? config.easyPostApiKeyMasked : "EZT..."}
                  autoComplete="off"
                  helpText={config?.hasEasyPostKey ? "API key configured." : "Optional — needed for tracking and rebook actions."}
                />
              </div>
              {config?.hasEasyPostKey && <Badge tone="success">Active</Badge>}
            </InlineStack>
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingMd">AI Persona</Text>
            <TextField
              label="Assistant name"
              name="aiPersonaName"
              value={personaName}
              onChange={setPersonaName}
              autoComplete="off"
              helpText='The name your AI assistant uses. Default: "Aria"'
            />
          </BlockStack>

          <BlockStack gap="200">
            <Text as="p" variant="bodyMd">
              Escalation confidence threshold: <strong>{threshold[0]}%</strong>
            </Text>
            <Text as="p" variant="bodyXs" tone="subdued">
              When AI confidence falls below this level, the conversation is escalated to a human agent.
            </Text>
            <RangeSlider
              label="Escalation threshold"
              labelHidden
              value={threshold[0] ?? 40}
              min={10}
              max={90}
              step={5}
              output
              onChange={(v) => setThreshold([typeof v === "number" ? v : (v[0] ?? 40)])}
            />
            <input type="hidden" name="autoEscalateThreshold" value={(threshold[0] ?? 40) / 100} />
          </BlockStack>

          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">Custom System Prompt</Text>
            <TextField
              label="Custom instructions"
              name="systemPromptOverride"
              value={systemPrompt}
              onChange={setSystemPrompt}
              multiline={5}
              autoComplete="off"
              placeholder="Leave blank to use the default DelivAI prompt. Override to add custom instructions."
            />
          </BlockStack>

          <InlineStack align="end">
            <Button variant="primary" submit loading={fetcher.state === "submitting"}>
              Save AI Settings
            </Button>
          </InlineStack>
        </BlockStack>
      </FetcherForm>
    </Card>
  );
}

function WidgetSettingsTab({
  config,
  shop,
  fetcher,
}: {
  config: ReturnType<typeof useLoaderData<typeof loader>>["config"];
  shop: string;
  fetcher: ReturnType<typeof useFetcher>;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const FetcherForm = fetcher.Form as React.ComponentType<any>;
  const [color, setColor] = useState(config?.widgetColor ?? "#5B4FE8");
  const [position, setPosition] = useState(config?.widgetPosition ?? "bottom-right");
  const [greeting, setGreeting] = useState(
    config?.greetingMessage ?? "Hi! I can help you track or manage your order.",
  );
  const [collectEmail, setCollectEmail] = useState(config?.collectEmailUpfront ?? false);

  return (
    <Card>
      <FetcherForm method="post">
        <input type="hidden" name="intent" value="save_widget" />
        <BlockStack gap="400">
          <FormLayout>
            <TextField
              label="Widget color (hex)"
              name="widgetColor"
              value={color}
              onChange={setColor}
              autoComplete="off"
              prefix={
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: color,
                    border: "1px solid #ddd",
                  }}
                />
              }
            />

            <Select
              label="Widget position"
              name="widgetPosition"
              options={[
                { label: "Bottom right", value: "bottom-right" },
                { label: "Bottom left", value: "bottom-left" },
              ]}
              value={position}
              onChange={setPosition}
            />

            <TextField
              label="Greeting message"
              name="greetingMessage"
              value={greeting}
              onChange={setGreeting}
              autoComplete="off"
              multiline={2}
            />

            <Checkbox
              label="Ask customer for email before starting chat"
              checked={collectEmail}
              onChange={setCollectEmail}
            />
            <input type="hidden" name="collectEmailUpfront" value={String(collectEmail)} />
          </FormLayout>

          {/* Preview */}
          <Card background="bg-fill-secondary">
            <BlockStack gap="200">
              <Text as="p" variant="bodyMd" fontWeight="semibold">Widget Preview</Text>
              <div style={{ position: "relative", height: 60 }}>
                <div
                  style={{
                    position: "absolute",
                    right: position === "bottom-right" ? 0 : "auto",
                    left: position === "bottom-left" ? 0 : "auto",
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                  </svg>
                </div>
              </div>
            </BlockStack>
          </Card>

          <Banner tone="info" title="Install on your store">
            <Text as="p">
              Go to your{" "}
              <a
                href={`https://${shop}/admin/themes/current/editor`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Theme Editor
              </a>
              , click "Add section" → "Apps" → Enable DelivAI Chat.
            </Text>
          </Banner>

          <InlineStack align="end">
            <Button variant="primary" submit loading={fetcher.state === "submitting"}>
              Save Widget Settings
            </Button>
          </InlineStack>
        </BlockStack>
      </FetcherForm>
    </Card>
  );
}

function TeamSettingsTab() {
  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h3" variant="headingMd">Team Members</Text>
        <Text as="p" tone="subdued">
          Invite agents to manage escalated conversations in your inbox.
        </Text>
        <Button>Invite Agent</Button>
      </BlockStack>
    </Card>
  );
}
