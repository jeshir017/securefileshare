mixin () {
  public query func getApiDoc() : async Text {
    "# Secure File Sharing System — Backend API

## Purpose

The backend of the Secure File Sharing System lets registered users upload,
store, share, and download files securely. It enforces role-based access
control (normal user vs admin), hashes passwords, records audit events, and
exposes its persisted data through an OQL query layer. The backend never stores
raw file bytes or encryption keys — it keeps only metadata plus a reference to
the encrypted blob held by the object-storage extension.

## Public methods

### Authentication & roles

- `register(name : Text, email : Text, password : Text) : async Result<User, AuthError>`
  Registers the caller as a new user. Validates password strength (at least 8
  characters containing an uppercase letter, a lowercase letter, a digit, and a
  symbol), checks that the email is not already taken (case-insensitive), hashes
  the password, and stores the user with status `#active`. Returns `#err(#weakPassword)`
  or `#err(#emailTaken)` on failure.
- `login(email : Text, password : Text) : async Result<User, AuthError>`
  Authenticates by email (case-insensitive) and password. On failure records a
  failed login and returns `#err(#invalidCredentials)` or `#err(#accountDeactivated)`.
- `logout() : async ()` — No-op. Sessions are managed client-side; the backend
  keeps no server-side session state.
- `getCallerUser() : async ?User` — Returns the caller's user record, or `null`
  if the caller is not registered.
- `getCallerUserRole() : async UserRole` — Returns the caller's role
  (`#admin`, `#user`, or `#guest`). Anonymous callers get `#guest`. A signed-in
  caller who has not been registered traps with `\"User is not registered\"`.
- `isCallerAdmin() : async Bool` — Whether the caller has the `#admin` role.
- `assignCallerUserRole(user : Principal, role : UserRole) : async ()` —
  Admin-only. Assigns a role to a user. Non-admins trap with
  `\"Unauthorized: Only admins can assign user roles\"`.
- `setAccountStatus(target : Principal, status : AccountStatus) : async Result<(), AuthError>`
  — Admin-only. Activates or deactivates a user. Non-admins trap with
  `\"Unauthorized\"`. Returns `#err(#notRegistered)` if the target is not registered.
- `_initialize_access_control() : async ()` — Registers the caller into the
  role map. The first signed-in caller to call this becomes `#admin`; every
  subsequent caller becomes `#user`. Anonymous callers are ignored.
- `_internet_identity_sign_in_start() : async Blob` /
  `_internet_identity_sign_in_finish() : async Result<(), Verify.Error>` —
  Internet Identity sign-in flow used by the frontend.
- `listFailedLogins() : async [FailedLogin]` — Admin-only. Returns the recorded
  failed-login attempts keyed by principal. Non-admins trap with `\"Unauthorized\"`.

### Files

- `uploadFile(originalFilename, storedFilename, mimeType, fileSize, sha256Hash, blob) : async FileView`
  — Records a new file owned by the caller. Requires `#user` permission. The
  `blob` is the encrypted file bytes held by object storage; the backend stores
  only metadata and a reference. Each call creates a new file.
- `listMyFiles() : async [FileView]` — Lists the caller's own files. Requires
  `#user` permission.
- `downloadFile(id : FileId) : async ?Storage.ExternalBlob` — Returns the
  encrypted blob of the caller's own file, or `null` if not found. Requires
  `#user` permission; traps with `\"Unauthorized: You can only download your own files\"`
  if the file belongs to someone else.
- `deleteFile(id : FileId) : async Bool` — Deletes the caller's own file.
  Returns `true` if deleted, `false` if not found. Requires `#user` permission;
  traps with `\"Unauthorized: You can only delete your own files\"` if the file
  belongs to someone else.

### Sharing

- `createShare(fileId, sharedWith, permission, expiresAt) : async ShareView` —
  Owner shares a file with another registered user, generating a cryptographically
  secure random share token (never exposing database IDs). Requires `#user`
  permission.
- `listOwnerShares() : async [ShareView]` — Lists the caller's active (non-revoked)
  shared links. Requires `#user` permission.
- `revokeShare(shareId) : async Bool` — Owner revokes a share. Returns `true` if
  revoked, `false` if the share is not found, not owned, or already revoked.
  Requires `#user` permission.
- `listSharesForUser() : async [ShareView]` — Lists files shared with the caller
  that are not revoked and not expired. Requires `#user` permission.
- `checkDownloadAccess(shareId) : async Bool` — Whether the caller may download
  the file for a share: caller is the intended recipient, permission is
  `#download`, the share is not revoked, and it has not expired. Requires
  `#user` permission.

### Audit

- `getMyActivity() : async [AuditLog]` — The caller's own audit events.
- `getAllLogs() : async [AuditLog]` — All audit events.
- `getFailedLogins() : async [FailedLogin]` — All recorded failed-login events.

### OQL

- `schema() : async Text` — The OQL schema describing the queryable entities.
- `execute(query : Text) : async Text` — Runs an OQL query against the exposed
  entities.

## Authentication and identity

The following methods require a signed (non-anonymous) caller and trap or fail
for anonymous callers: `register`, `login`, `getCallerUser`, `getCallerUserRole`,
`isCallerAdmin`, `assignCallerUserRole`, `setAccountStatus`, `uploadFile`,
`listMyFiles`, `downloadFile`, `deleteFile`, `createShare`, `listOwnerShares`,
`revokeShare`, `listSharesForUser`, `checkDownloadAccess`, `getMyActivity`,
`getAllLogs`, `getFailedLogins`, `listFailedLogins`, and `_initialize_access_control`.

The app's frontend pins an Internet Identity derivation origin, published at
`/.well-known/ii-derivation-origin` when available. An agent already holding the
user's Internet Identity authorization derives the correct per-app principal
against that origin (for example `icp identity link web <name> --app <host>`).
Such a delegation acts with the user's full authority in this app until it
expires.

### Registration prerequisite

Access is gated on registration. A direct API caller must register before any
role-guarded call (guarded queries included) by calling `_initialize_access_control`
once as a signed-in caller. The first initializer receives the `#admin` role;
every subsequent caller receives `#user`. An unregistered signed-in caller
receives a trap on `getCallerUserRole` with the message `\"User is not registered\"`,
and is denied every `#user`-gated operation. An anonymous caller receives the
`#guest` role and is likewise denied every `#user`-gated operation.

A caller can be unregistered while the app appears to already know it because
registration happens only when a caller signs in through the app's own frontend.
A principal that never did so is unregistered even when it belongs to the app's
owner, and a signed-in caller derived against a different origin is a different
principal than the one the frontend registered.

## Units and encodings

- Timestamps (`createdAt`, `uploadedAt`, `timestamp`, `attemptedAt`, `expiresAt`)
  are `Int` nanoseconds since the Unix epoch (`Time.now()`).
- `expiresAt` is optional (`?Int`); `null` means the share never expires.
- Identifiers (`id`, `fileId`, `shareId`) are `Nat`.
- `sha256Hash` and `shareToken` are lowercase hex strings (64 characters).
- `permission` is a variant `#view` or `#download`.
- `status` is a variant `#active` or `#deactivated`.
- `action` is a variant: `#login`, `#logout`, `#failedLogin`, `#upload`,
  `#download`, `#delete`, `#share`, `#linkCreate`, `#linkRevoke`,
  `#unauthorizedAccess`.
- `blob` is the encrypted file bytes (`Storage.ExternalBlob`).

## Lifecycle and polling

Shares carry an optional `expiresAt`. `listSharesForUser` and
`checkDownloadAccess` treat a share as expired when `now > expiresAt`; expired
shares are excluded from the recipient's list and denied on download. There is
no background expiry job — expiry is evaluated lazily at read time. There is no
long-running async operation to poll; all methods return promptly.

## Mutation retry safety

- `register` is not idempotent: registering the same email twice returns
  `#err(#emailTaken)`.
- `uploadFile` and `createShare` create a new record on every call; retrying
  duplicates the record.
- `revokeShare` and `deleteFile` are safe to retry: a second call on an
  already-revoked or already-deleted record returns `false` rather than trapping.
- `setAccountStatus` is idempotent for a registered target.

## Errors, traps, and limits

- `register` returns `#err(#weakPassword)` or `#err(#emailTaken)`.
- `login` returns `#err(#invalidCredentials)` or `#err(#accountDeactivated)`.
- `setAccountStatus` returns `#err(#notRegistered)` for an unknown target.
- Role-guarded file and share operations trap with
  `\"Unauthorized: Only users can perform this action\"` (files) or
  `\"Unauthorized: Only registered users can ...\"` (shares) when the caller
  lacks `#user` permission.
- `downloadFile`/`deleteFile` trap with
  `\"Unauthorized: You can only download your own files\"` /
  `\"Unauthorized: You can only delete your own files\"` when the caller is not
  the owner.
- `assignCallerUserRole` traps with
  `\"Unauthorized: Only admins can assign user roles\"` for non-admins.
- `getCallerUserRole` traps with `\"User is not registered\"` for an unregistered
  signed-in caller.

## Non-obvious gotchas

- Passwords are hashed with SHA-256 of a salted value, not Argon2/bcrypt.
- The backend stores only file metadata and a blob reference; raw file bytes and
  encryption keys never reach the backend.
- The first caller to initialize access control permanently becomes admin; this
  is a one-time assignment.
- Anonymous callers are always `#guest` and cannot perform any `#user`-gated
  operation.
"
  };
};
