import { describe, expect, it } from "vitest";

import { getKey, prepareUpload, removeKey, storeKey } from "@/lib/vault";

/** jsdom's File lacks `arrayBuffer`; provide the minimal surface prepareUpload needs. */
function makeFile(contents: string, name: string, type: string): File {
  const bytes = new TextEncoder().encode(contents);
  const file = new File([bytes], name, { type });
  Object.defineProperty(file, "arrayBuffer", {
    value: () => Promise.resolve(bytes.buffer),
  });
  return file;
}

describe("vault upload preparation", () => {
  it("encrypts a file and returns ciphertext, hash, key and iv", async () => {
    const file = makeFile("hello vault", "notes.txt", "text/plain");
    const prepared = await prepareUpload(file);

    // The ciphertext is non-empty and differs from the plaintext.
    expect(prepared.ciphertext.byteLength).toBeGreaterThan(0);
    expect(new TextDecoder().decode(prepared.ciphertext)).not.toBe(
      "hello vault",
    );

    // The SHA-256 hash matches the plaintext, not the ciphertext.
    const plainHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode("hello vault"),
    );
    const expectedHex = Array.from(new Uint8Array(plainHash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    expect(prepared.sha256).toBe(expectedHex);

    // A usable AES key and a 12-byte IV are produced.
    expect(prepared.key.type).toBe("secret");
    expect(prepared.iv.byteLength).toBe(12);
  });

  it("stores and retrieves a key by file id, and removes it", async () => {
    const file = makeFile("data", "a.txt", "text/plain");
    const prepared = await prepareUpload(file);

    storeKey("42", { key: prepared.key, iv: prepared.iv });
    const stored = getKey("42");
    expect(stored).toBeDefined();
    expect(stored!.key).toBe(prepared.key);
    expect(stored!.iv).toEqual(prepared.iv);

    removeKey("42");
    expect(getKey("42")).toBeUndefined();
  });

  it("returns undefined for an unknown file id", () => {
    expect(getKey("does-not-exist")).toBeUndefined();
  });
});
