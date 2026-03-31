/**
 * Global test setup — runs before every test file.
 * Sets env vars needed by encryption.server.ts and other modules.
 */
import { vi } from "vitest";

// ── Environment ──────────────────────────────────────────────────────────────
// Stable 32-byte hex key for deterministic encryption tests
process.env.ENCRYPTION_KEY = "a".repeat(64);
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.SESSION_SECRET = "test_session_secret";

// ── Prisma mock ───────────────────────────────────────────────────────────────
// Mock at module level so all imports get the same mock instance
vi.mock("~/lib/db/prisma.server", () => ({
  prisma: {
    conversation: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    toolCall: {
      create: vi.fn(),
      update: vi.fn(),
    },
    store: {
      findUnique: vi.fn(),
    },
    knowledgeChunk: {
      upsert: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $disconnect: vi.fn(),
  },
}));

// ── Anthropic mock ────────────────────────────────────────────────────────────
vi.mock("@anthropic-ai/sdk", () => {
  const mockStream = {
    [Symbol.asyncIterator]: async function* () {
      yield { type: "content_block_delta", delta: { type: "text_delta", text: "Hello " } };
      yield { type: "content_block_delta", delta: { type: "text_delta", text: "world!" } };
      yield {
        type: "message_delta",
        delta: { stop_reason: "end_turn" },
        usage: { output_tokens: 5 },
      };
    },
    finalMessage: vi.fn().mockResolvedValue({
      id: "msg_test",
      content: [{ type: "text", text: "Hello world!" }],
      stop_reason: "end_turn",
      usage: { input_tokens: 10, output_tokens: 5 },
    }),
  };

  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        stream: vi.fn().mockReturnValue(mockStream),
        create: vi.fn().mockResolvedValue({
          id: "msg_test",
          content: [{ type: "text", text: "Hello world!" }],
          stop_reason: "end_turn",
        }),
      },
    })),
  };
});

// ── OpenAI mock (embeddings) ──────────────────────────────────────────────────
vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    embeddings: {
      create: vi.fn().mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }],
      }),
    },
  })),
}));

// ── EasyPost mock ─────────────────────────────────────────────────────────────
vi.mock("@easypost/api", () => ({
  default: vi.fn().mockImplementation(() => ({
    Tracker: {
      retrieve: vi.fn().mockResolvedValue({
        id: "trk_test_001",
        status: "in_transit",
        tracking_code: "1Z999AA10123456784",
        carrier: "UPS",
        tracking_details: [
          {
            message: "Package transferred to destination facility",
            datetime: "2026-03-29T10:00:00Z",
            tracking_location: { city: "New York", state: "NY" },
          },
        ],
        est_delivery_date: "2026-03-30",
      }),
    },
    Address: {
      create: vi.fn().mockResolvedValue({ id: "adr_test_001", street1: "123 Main St" }),
    },
    Parcel: {
      create: vi.fn().mockResolvedValue({ id: "prcl_test_001" }),
    },
    Shipment: {
      create: vi.fn().mockResolvedValue({
        id: "shp_test_001",
        rates: [{ id: "rate_001", carrier: "USPS", service: "Priority", rate: "8.50" }],
      }),
      lowestRate: vi.fn().mockReturnValue({ id: "rate_001", carrier: "USPS", service: "Priority", rate: "8.50" }),
      buy: vi.fn().mockResolvedValue({
        id: "shp_test_001",
        postage_label: { label_url: "https://easypost.com/label/test" },
        tracker: { id: "trk_test_002", tracking_code: "1Z999AA10123456784" },
      }),
    },
  })),
}));

// ── Pino logger mock ──────────────────────────────────────────────────────────
vi.mock("~/lib/logger.server", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  },
}));
