import { describe, expect, it } from "vitest";

import {
  decryptFile,
  encryptFile,
  generateEncryptionKey,
  importKey,
  sha256Hex,
} from "@/lib/crypto";

describe("crypto", () => {
  it("computes a stable SHA-256 hex digest", async () => {
    const hash = await sha256Hex(new TextEncoder().encode("hello"));
    // SHA-256("hello") is a well-known digest.
    expect(hash).toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
  });

  it("round-trips AES-256-GCM encryption and decryption", async () => {
    const key = await generateEncryptionKey();
    const plaintext = new TextEncoder().encode("secret file contents").buffer;
    const { ciphertext, iv } = await encryptFile(plaintext, key);

    // Ciphertext differs from plaintext and is non-empty.
    expect(ciphertext.byteLength).toBeGreaterThan(0);
    expect(new Uint8Array(ciphertext)).not.toEqual(new Uint8Array(plaintext));

    const decrypted = await decryptFile(ciphertext, iv, key);
    expect(new TextDecoder().decode(decrypted)).toBe("secret file contents");
  });

  it("exports and re-imports a key as a JSON Web Key", async () => {
    const key = await generateEncryptionKey();
    const jwk = await crypto.subtle.exportKey("jwk", key);
    expect(jwk.kty).toBe("oct");
    expect(jwk.alg).toBe("A256GCM");

    const imported = await importKey(jwk);
    expect(imported.type).toBe("secret");
  });
});
