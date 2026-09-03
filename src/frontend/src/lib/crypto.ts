/**
 * Browser-side cryptography for the secure vault.
 *
 * Files are encrypted with AES-256-GCM before they ever leave the browser.
 * The encryption key is generated and held only in memory (or exported to the
 * caller for local persistence) — it is NEVER sent to the backend. A SHA-256
 * integrity hash is computed for each file and stored on the backend so
 * downloads can be verified against tampering.
 */

const encoder = new TextEncoder();

/** Compute the SHA-256 digest of a buffer and return it as a lowercase hex string. */
export async function sha256Hex(
  data: ArrayBuffer | Uint8Array,
): Promise<string> {
  const input =
    data instanceof Uint8Array ? new Uint8Array(data) : new Uint8Array(data);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Generate a fresh AES-256-GCM key. */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

/** Encrypt a file buffer with AES-256-GCM, returning the ciphertext and its IV. */
export async function encryptFile(
  data: ArrayBuffer,
  key: CryptoKey,
): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data,
  );
  return { ciphertext, iv };
}

/** Decrypt an AES-256-GCM ciphertext using the provided IV and key. */
export async function decryptFile(
  ciphertext: ArrayBuffer,
  iv: Uint8Array,
  key: CryptoKey,
): Promise<ArrayBuffer> {
  const ivBuffer = new Uint8Array(iv);
  return crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBuffer },
    key,
    ciphertext,
  );
}

/** Export an AES key as a JSON Web Key for local persistence. */
export async function exportKey(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey("jwk", key);
}

/** Import an AES key from a JSON Web Key. */
export async function importKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey("jwk", jwk, { name: "AES-GCM" }, true, [
    "encrypt",
    "decrypt",
  ]);
}

/** Encode a string to a Uint8Array (UTF-8). */
export function encodeText(text: string): Uint8Array {
  return encoder.encode(text);
}
