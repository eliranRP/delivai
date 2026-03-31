import { describe, it, expect } from "vitest";
import {
  encrypt,
  decrypt,
  maskApiKey,
} from "~/lib/crypto/encryption.server";

describe("encryption.server", () => {
  const plaintext = "sk-ant-api03-realkey-abc123xyz";

  describe("encrypt / decrypt roundtrip", () => {
    it("decrypts to the original plaintext", () => {
      const ciphertext = encrypt(plaintext);
      expect(decrypt(ciphertext)).toBe(plaintext);
    });

    it("produces a different ciphertext each call (random IV)", () => {
      const c1 = encrypt(plaintext);
      const c2 = encrypt(plaintext);
      expect(c1).not.toBe(c2);
    });

    it("ciphertext is a base64 string", () => {
      const ciphertext = encrypt(plaintext);
      expect(() => Buffer.from(ciphertext, "base64")).not.toThrow();
    });
  });

  describe("decrypt", () => {
    it("throws on tampered ciphertext", () => {
      const ciphertext = encrypt(plaintext);
      const tampered = ciphertext.slice(0, -4) + "XXXX";
      expect(() => decrypt(tampered)).toThrow();
    });

    it("throws on garbage input", () => {
      expect(() => decrypt("not-valid-base64!!!!")).toThrow();
    });
  });

  describe("maskApiKey", () => {
    it("masks the middle of a Claude API key, showing first 4 and last 4", () => {
      const masked = maskApiKey("sk-ant-api03-realkey-abc123xyz");
      // new implementation: first 4 + 20 bullets + last 4
      expect(masked).toMatch(/^sk-a/);
      expect(masked).toContain("•••");
      expect(masked).not.toContain("realkey");
      expect(masked.endsWith("3xyz")).toBe(true);
    });

    it("fully masks short keys", () => {
      const masked = maskApiKey("short");
      expect(masked).toBe("•••••");
      expect(masked).not.toContain("short");
    });
  });
});
