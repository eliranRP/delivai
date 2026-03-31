import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV for GCM
const TAG_LENGTH = 16; // 128-bit auth tag

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY env var is not set");
  const buf = Buffer.from(key, "hex");
  if (buf.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes (64 hex chars)");
  return buf;
}

/**
 * Encrypt a plaintext string.
 * Returns a base64-encoded string: iv(12) + ciphertext + tag(16)
 */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Pack: iv || ciphertext || tag
  const packed = Buffer.concat([iv, encrypted, tag]);
  return packed.toString("base64");
}

/**
 * Decrypt a base64-encoded ciphertext produced by `encrypt`.
 */
export function decrypt(ciphertext: string): string {
  const packed = Buffer.from(ciphertext, "base64");
  const iv = packed.subarray(0, IV_LENGTH);
  const tag = packed.subarray(packed.length - TAG_LENGTH);
  const encrypted = packed.subarray(IV_LENGTH, packed.length - TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

/**
 * Mask an API key for display: shows first 8 chars then asterisks.
 * e.g. "sk-ant-api03-..." → "sk-ant-a***************"
 */
export function maskApiKey(key: string): string {
  if (key.length <= 12) return "•".repeat(key.length);
  return key.slice(0, 4) + "•".repeat(20) + key.slice(-4);
}
