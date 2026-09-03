import { PocketIc, createIdentity } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

let pic: PocketIc | undefined;
let actor: _SERVICE;

// Distinct, deterministic callers. `createIdentity` is resolvable from the lane
// (it ships with @dfinity/pic), unlike @icp-sdk/core/principal which only lives
// in the frontend package and is unreachable from app/test/pocketic/.
const ADMIN = createIdentity("admin-seed").getPrincipal();
const ALICE = createIdentity("alice-seed").getPrincipal();
const BOB = createIdentity("bob-seed").getPrincipal();

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  ({ actor } = await pic.setupCanister<_SERVICE>({ idlFactory, wasm: BACKEND_WASM }));
});

afterAll(async () => {
  await pic?.tearDown();
});

it("answers an empty-state read instead of trapping", async () => {
  actor.setPrincipal(ADMIN);
  await actor._initialize_access_control();
  expect(await actor.listMyFiles()).toEqual([]);
  expect(await actor.listOwnerShares()).toEqual([]);
  expect(await actor.listSharesForUser()).toEqual([]);
  expect(await actor.getMyActivity()).toEqual([]);
});

it("registers a user and rejects a weak password and a duplicate email", async () => {
  actor.setPrincipal(ALICE);
  await actor._initialize_access_control();

  const weak = await actor.register("Alice", "alice@example.com", "short");
  expect(weak).toEqual({ err: { weakPassword: null } });

  const ok = await actor.register("Alice", "alice@example.com", "Str0ng!Pass");
  expect(ok).toMatchObject({ ok: { name: "Alice", email: "alice@example.com" } });

  const dup = await actor.register("Alice", "ALICE@example.com", "Str0ng!Pass");
  expect(dup).toEqual({ err: { emailTaken: null } });
});

it("logs a user in and records a failed login for bad credentials", async () => {
  actor.setPrincipal(ALICE);
  const good = await actor.login("alice@example.com", "Str0ng!Pass");
  expect(good).toMatchObject({ ok: { name: "Alice" } });

  const bad = await actor.login("alice@example.com", "wrong-password");
  expect(bad).toEqual({ err: { invalidCredentials: null } });

  // The failed login is recorded and visible to an admin.
  actor.setPrincipal(ADMIN);
  const failed = await actor.listFailedLogins();
  expect(failed.some((f) => f.email === "alice@example.com")).toBe(true);
});

it("round-trips an upload through the real canister", async () => {
  actor.setPrincipal(ALICE);
  const view = await actor.uploadFile(
    "report.txt",
    "report.txt",
    "text/plain",
    12n,
    "abc123",
    new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
  );
  expect(view.originalFilename).toBe("report.txt");
  expect(view.sha256Hash).toBe("abc123");

  const mine = await actor.listMyFiles();
  expect(mine).toHaveLength(1);
  expect(mine[0].id).toBe(view.id);
});

it("lets the owner download their own file without a decryption key", async () => {
  actor.setPrincipal(ALICE);
  const mine = await actor.listMyFiles();
  const fileId = mine[0].id;
  const result = await actor.downloadFile(fileId);
  expect(result).not.toBeNull();
  expect(result![0].decryptionKey).toEqual([]);
});

it("shares a file with a recipient and enforces download access", async () => {
  actor.setPrincipal(ALICE);
  const mine = await actor.listMyFiles();
  const fileId = mine[0].id;

  const share = await actor.createShare(
    fileId,
    BOB,
    { download: null },
    [],
    "jwk-data",
  );
  expect(share.shareToken.length).toBeGreaterThan(0);
  expect(share.revoked).toBe(false);

  // The recipient can download and receives the decryption key.
  actor.setPrincipal(BOB);
  await actor._initialize_access_control();
  expect(await actor.checkDownloadAccess(share.id)).toBe(true);
  const received = await actor.listSharesForUser();
  expect(received.some((s) => s.id === share.id)).toBe(true);
  const download = await actor.downloadFile(fileId);
  expect(download![0].decryptionKey).toEqual(["jwk-data"]);
});

it("rejects a revoked share on download", async () => {
  actor.setPrincipal(ALICE);
  // A fresh file, so BOB has no other valid share on it that could satisfy the
  // download after this one is revoked.
  const view = await actor.uploadFile(
    "revoked.txt",
    "revoked.txt",
    "text/plain",
    3n,
    "revhash",
    new Uint8Array([7, 8, 9]),
  );
  const share = await actor.createShare(view.id, BOB, { download: null }, [], "k");
  expect(await actor.revokeShare(share.id)).toBe(true);

  actor.setPrincipal(BOB);
  expect(await actor.checkDownloadAccess(share.id)).toBe(false);
  // `downloadFile` returns `?DownloadResult`; an absent value decodes to `[]`.
  expect(await actor.downloadFile(view.id)).toEqual([]);
});

it("does not show one caller's files to another", async () => {
  actor.setPrincipal(BOB);
  const bobFiles = await actor.listMyFiles();
  expect(bobFiles).toHaveLength(0);
});

it("lets an admin deactivate a user and blocks their sign-in", async () => {
  actor.setPrincipal(ADMIN);
  const users = await actor.listAllUsers();
  const alice = users.find((u) => u.email === "alice@example.com");
  expect(alice).toBeDefined();

  const result = await actor.setAccountStatus(ALICE, { deactivated: null });
  expect(result).toEqual({ ok: null });

  actor.setPrincipal(ALICE);
  const login = await actor.login("alice@example.com", "Str0ng!Pass");
  expect(login).toEqual({ err: { accountDeactivated: null } });
});

it("lets an admin review audit logs and failed logins", async () => {
  actor.setPrincipal(ADMIN);
  const logs = await actor.getAllLogs();
  expect(logs.length).toBeGreaterThan(0);
  const actions = logs.map((l) => l.action);
  expect(actions).toContainEqual({ login: null });
  expect(actions).toContainEqual({ failedLogin: null });
  expect(actions).toContainEqual({ upload: null });
  expect(actions).toContainEqual({ share: null });

  const failed = await actor.getFailedLogins();
  expect(failed.length).toBeGreaterThan(0);
});
