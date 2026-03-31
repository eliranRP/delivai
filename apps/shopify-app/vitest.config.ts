import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "~": resolve(__dirname, "./app"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["./tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["app/lib/**/*.ts"],
      exclude: ["app/lib/**/*.d.ts"],
    },
    // Isolate each test file — prevents Prisma mock bleed-through
    isolate: true,
    // Mock all .server.ts imports that touch external services
    server: {
      deps: {
        // Force re-import so vi.mock() takes effect
        inline: ["@anthropic-ai/sdk", "@easypost/api", "openai"],
      },
    },
  },
});
