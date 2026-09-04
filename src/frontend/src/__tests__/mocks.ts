import { vi } from "vitest";

import type { AuditLog, FileView, ShareView, User } from "@/backend";
import {
  AccountStatus,
  AuditAction,
  SharePermission,
  UserRole,
} from "@/backend";
import type { Identity } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";

export const ADMIN_PRINCIPAL = Principal.fromText(
  "rdmx6-jaaaa-aaaaa-aaadq-cai",
);
export const USER_PRINCIPAL = Principal.fromText("2vxsx-fae");

export const adminUser: User = {
  status: AccountStatus.active,
  principal: ADMIN_PRINCIPAL,
  name: "Admin",
  createdAt: 1_700_000_000_000_000_000n,
  email: "admin@example.com",
  passwordHash: "hash",
};

export const regularUser: User = {
  status: AccountStatus.active,
  principal: USER_PRINCIPAL,
  name: "Alice",
  createdAt: 1_700_000_000_000_000_000n,
  email: "alice@example.com",
  passwordHash: "hash",
};

export const sampleFile: FileView = {
  id: 1n,
  originalFilename: "report.txt",
  sha256Hash: "abc123",
  mimeType: "text/plain",
  fileSize: 1024n,
  storedFilename: "report.txt",
  uploadedAt: 1_700_000_000_000_000_000n,
};

export const sampleShare: ShareView = {
  id: 1n,
  permission: SharePermission.download,
  expiresAt: undefined,
  revoked: false,
  owner: ADMIN_PRINCIPAL,
  createdAt: 1_700_000_000_000_000_000n,
  shareToken: "token123",
  decryptionKey: "key",
  sharedWith: USER_PRINCIPAL,
  fileId: 1n,
};

export const sampleLog: AuditLog = {
  id: 1n,
  action: AuditAction.login,
  userId: USER_PRINCIPAL,
  fileId: undefined,
  timestamp: 1_700_000_000_000_000_000n,
  details: "login",
  ipAddress: "127.0.0.1",
};

export interface MockActor {
  listMyFiles: ReturnType<typeof vi.fn>;
  listOwnerShares: ReturnType<typeof vi.fn>;
  listSharesForUser: ReturnType<typeof vi.fn>;
  getMyActivity: ReturnType<typeof vi.fn>;
  uploadFile: ReturnType<typeof vi.fn>;
  downloadFile: ReturnType<typeof vi.fn>;
  deleteFile: ReturnType<typeof vi.fn>;
  checkDownloadAccess: ReturnType<typeof vi.fn>;
  createShare: ReturnType<typeof vi.fn>;
  revokeShare: ReturnType<typeof vi.fn>;
  listAllFiles: ReturnType<typeof vi.fn>;
  listAllUsers: ReturnType<typeof vi.fn>;
  listAllShares: ReturnType<typeof vi.fn>;
  getAllLogs: ReturnType<typeof vi.fn>;
  listFailedLogins: ReturnType<typeof vi.fn>;
  setAccountStatus: ReturnType<typeof vi.fn>;
  register: ReturnType<typeof vi.fn>;
  login: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
  getCallerUser: ReturnType<typeof vi.fn>;
  getCallerUserRole: ReturnType<typeof vi.fn>;
}

/** Build a mock actor with sensible defaults; override per-test. */
export function createMockActor(overrides: Partial<MockActor> = {}): MockActor {
  const actor: MockActor = {
    listMyFiles: vi.fn().mockResolvedValue([]),
    listOwnerShares: vi.fn().mockResolvedValue([]),
    listSharesForUser: vi.fn().mockResolvedValue([]),
    getMyActivity: vi.fn().mockResolvedValue([]),
    uploadFile: vi.fn().mockResolvedValue(sampleFile),
    downloadFile: vi.fn().mockResolvedValue(null),
    deleteFile: vi.fn().mockResolvedValue(false),
    checkDownloadAccess: vi.fn().mockResolvedValue(false),
    createShare: vi.fn().mockResolvedValue(sampleShare),
    revokeShare: vi.fn().mockResolvedValue(false),
    listAllFiles: vi.fn().mockResolvedValue([]),
    listAllUsers: vi.fn().mockResolvedValue([]),
    listAllShares: vi.fn().mockResolvedValue([]),
    getAllLogs: vi.fn().mockResolvedValue([]),
    listFailedLogins: vi.fn().mockResolvedValue([]),
    setAccountStatus: vi.fn().mockResolvedValue({ __kind__: "ok", ok: null }),
    register: vi.fn().mockResolvedValue({ __kind__: "ok", ok: regularUser }),
    login: vi.fn().mockResolvedValue({ __kind__: "ok", ok: regularUser }),
    logout: vi.fn().mockResolvedValue(undefined),
    getCallerUser: vi.fn().mockResolvedValue(regularUser),
    getCallerUserRole: vi.fn().mockResolvedValue(UserRole.user),
    ...overrides,
  };
  return actor;
}

export type MockAuthValue = {
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoggingIn: boolean;
  identity: Identity | undefined;
  login: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  user: User | null;
  role: UserRole | null;
  isAdmin: boolean;
  authLoading: boolean;
  register: ReturnType<typeof vi.fn>;
  loginApp: ReturnType<typeof vi.fn>;
  logoutApp: ReturnType<typeof vi.fn>;
  registerPending: boolean;
  loginPending: boolean;
  logoutPending: boolean;
};

export function createMockAuth(
  overrides: Partial<MockAuthValue> = {},
): MockAuthValue {
  return {
    isAuthenticated: true,
    isInitializing: false,
    isLoggingIn: false,
    identity: undefined,
    login: vi.fn(),
    clear: vi.fn(),
    user: regularUser,
    role: UserRole.user,
    isAdmin: false,
    authLoading: false,
    register: vi.fn().mockResolvedValue(true),
    loginApp: vi.fn().mockResolvedValue(true),
    logoutApp: vi.fn().mockResolvedValue(undefined),
    registerPending: false,
    loginPending: false,
    logoutPending: false,
    ...overrides,
  };
}

export { AccountStatus, AuditAction, SharePermission, UserRole };
