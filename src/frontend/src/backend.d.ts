import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
import type { ExternalBlob } from "@caffeineai/object-storage";
export type { ExternalBlob } from "@caffeineai/object-storage";
export interface FileView {
    id: FileId;
    originalFilename: string;
    sha256Hash: string;
    mimeType: string;
    fileSize: bigint;
    storedFilename: string;
    uploadedAt: bigint;
}
export type Timestamp = bigint;
export type Result_2 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface AuditLog {
    id: bigint;
    action: AuditAction;
    userId: Principal;
    fileId?: bigint;
    timestamp: bigint;
    details: string;
    ipAddress: string;
}
export interface User {
    status: AccountStatus;
    principal: Principal;
    name: string;
    createdAt: bigint;
    email: string;
    passwordHash: string;
}
export interface ShareView {
    id: ShareId;
    permission: SharePermission;
    expiresAt?: Timestamp;
    revoked: boolean;
    owner: Principal;
    createdAt: Timestamp;
    shareToken: string;
    decryptionKey: string;
    sharedWith: Principal;
    fileId: FileId;
}
export interface Result__1 {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result_1 = {
    __kind__: "ok";
    ok: User;
} | {
    __kind__: "err";
    err: AuthError;
};
export interface FailedLogin__1 {
    id: bigint;
    email: string;
    attemptedAt: bigint;
    ipAddress: string;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export type Result = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: AuthError;
};
export interface Cell {
    value: Value;
    name: string;
}
export interface FailedLogin {
    email: string;
    attemptedAt: bigint;
}
export type FileId = bigint;
export interface DownloadResult {
    blob: ExternalBlob;
    sha256Hash: string;
    decryptionKey?: string;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export type ShareId = bigint;
export enum AccountStatus {
    active = "active",
    deactivated = "deactivated"
}
export enum AuditAction {
    unauthorizedAccess = "unauthorizedAccess",
    linkCreate = "linkCreate",
    failedLogin = "failedLogin",
    logout = "logout",
    delete_ = "delete",
    login = "login",
    share = "share",
    upload = "upload",
    download = "download",
    linkRevoke = "linkRevoke"
}
export enum AuthError {
    accountDeactivated = "accountDeactivated",
    emailTaken = "emailTaken",
    weakPassword = "weakPassword",
    notRegistered = "notRegistered",
    unauthorized = "unauthorized",
    invalidCredentials = "invalidCredentials"
}
export enum SharePermission {
    view = "view",
    download = "download"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkDownloadAccess(shareId: ShareId): Promise<boolean>;
    createShare(fileId: FileId, sharedWith: Principal, permission: SharePermission, expiresAt: Timestamp | null, decryptionKey: string): Promise<ShareView>;
    deleteFile(id: FileId): Promise<boolean>;
    downloadFile(id: FileId): Promise<DownloadResult | null>;
    execute(qJson: string): Promise<Result__1>;
    getAllLogs(): Promise<Array<AuditLog>>;
    getApiDoc(): Promise<string>;
    getCallerUser(): Promise<User | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFailedLogins(): Promise<Array<FailedLogin__1>>;
    getMyActivity(): Promise<Array<AuditLog>>;
    isCallerAdmin(): Promise<boolean>;
    listAllFiles(): Promise<Array<FileView>>;
    listAllShares(): Promise<Array<ShareView>>;
    listAllUsers(): Promise<Array<User>>;
    listFailedLogins(): Promise<Array<FailedLogin>>;
    listMyFiles(): Promise<Array<FileView>>;
    listOwnerShares(): Promise<Array<ShareView>>;
    listSharesForUser(): Promise<Array<ShareView>>;
    login(email: string, password: string): Promise<Result_1>;
    logout(): Promise<void>;
    register(name: string, email: string, password: string): Promise<Result_1>;
    revokeShare(shareId: ShareId): Promise<boolean>;
    schema(): Promise<string>;
    setAccountStatus(target: Principal, status: AccountStatus): Promise<Result>;
    uploadFile(originalFilename: string, storedFilename: string, mimeType: string, fileSize: bigint, sha256Hash: string, blob: ExternalBlob): Promise<FileView>;
}
