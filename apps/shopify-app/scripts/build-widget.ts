#!/usr/bin/env node
/**
 * Build script: bundles chat-widget.ts → extensions/chat-widget/assets/chat-widget.js
 * Run: tsx scripts/build-widget.ts [--watch]
 */
import * as esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const ctx = await esbuild.context({
  entryPoints: [
    path.join(root, "extensions/chat-widget/assets/chat-widget.ts"),
  ],
  outfile: path.join(
    root,
    "extensions/chat-widget/assets/chat-widget.js"
  ),
  bundle: true,
  minify: process.env.NODE_ENV === "production",
  sourcemap: process.env.NODE_ENV !== "production",
  target: ["es2017", "chrome80", "firefox75", "safari13"],
  format: "iife",
  // Tree-shake — no external deps, everything bundled
  platform: "browser",
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV ?? "production"
    ),
  },
  logLevel: "info",
});

const isWatch = process.argv.includes("--watch");

if (isWatch) {
  await ctx.watch();
  console.log("👀  Watching chat-widget.ts for changes…");
} else {
  const result = await ctx.rebuild();
  if (result.errors.length > 0) {
    console.error("Build failed:", result.errors);
    process.exit(1);
  }
  console.log("✅  chat-widget.js built successfully");
  await ctx.dispose();
}
