/**
 * Browser-side vault orchestration for the secure file sharing app.
 *
 * Files are encrypted with AES-256-GCM before they ever leave the browser and
 * a SHA-256 integrity hash is stored on the backend. The encryption key is
 * generated and held ONLY in this module's in-memory store — it is never sent
 * to the backend and never rendered in the UI. Because the key lives only in
 * the current browser session, decryption is available to the session that
 * uploaded the file (or that holds the key), which is the intended security
 * model: the backend never sees plaintext or keys.
 */

import {
  decryptFile,
  encryptFile,
  generateEncryptionKey,
  sha256Hex,
} from "@/lib/crypto";

type StoredKey = { key: CryptoKey; iv: Uint8Array };

/** In-memory key store keyed by backend file id. Never persisted. */
const keyStore = new Map<string, StoredKey>();

export function storeKey(fileId: string, stored: StoredKey): void {
  keyStore.set(fileId, stored);
}

export function getKey(fileId: string): StoredKey | undefined {
  return keyStore.get(fileId);
}

export function removeKey(fileId: string): void {
  keyStore.delete(fileId);
}

export interface PreparedUpload {
  ciphertext: Uint8Array<ArrayBuffer>;
  sha256: string;
  key: CryptoKey;
  iv: Uint8Array;
}

/**
 * Encrypt a browser File with AES-256-GCM and compute its SHA-256 integrity
 * hash. Returns the ciphertext (ready to upload) plus the key/iv that must be
 * retained in this session to decrypt later.
 */
export async function prepareUpload(file: File): Promise<PreparedUpload> {
  const data = await file.arrayBuffer();
  const sha256 = await sha256Hex(data);
  const key = await generateEncryptionKey();
  const { ciphertext, iv } = await encryptFile(data, key);
  return { ciphertext: new Uint8Array(ciphertext), sha256, key, iv };
}

/**
 * Decrypt a downloaded ciphertext and verify its SHA-256 integrity hash
 * against the value stored on the backend. Throws when the key is unavailable
 * in this session or the hash does not match (tampering detected).
 */
export async function decryptAndVerify(
  fileId: string,
  ciphertext: Uint8Array,
  expectedHash: string,
): Promise<Uint8Array> {
  const stored = keyStore.get(fileId);
  if (!stored) {
    throw new Error(
      "Encryption key is not available in this session. Re-upload or obtain the file from the owner.",
    );
  }
  // Normalize to a fresh ArrayBuffer-backed Uint8Array so the underlying
  // buffer is a real ArrayBuffer (not ArrayBufferLike) before Web Crypto.
  const cipherBytes = new Uint8Array(ciphertext);
  const plaintext = await decryptFile(
    cipherBytes.buffer,
    stored.iv,
    stored.key,
  );
  const hash = await sha256Hex(plaintext);
  if (hash !== expectedHash) {
    throw new Error("Integrity check failed: file hash does not match.");
  }
  return new Uint8Array(plaintext);
}

/** Trigger a browser download of the given bytes under the given filename. */
export function triggerDownload(bytes: Uint8Array, filename: string): void {
  // Normalize to a fresh ArrayBuffer-backed Uint8Array for BlobPart typing.
  const blob = new Blob([new Uint8Array(bytes)]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
