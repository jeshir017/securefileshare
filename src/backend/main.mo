import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import ListEntity "mo:caffeineai-oql/ListEntity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import IntValue "mo:caffeineai-oql/IntValue";
import BoolValue "mo:caffeineai-oql/BoolValue";
import AuthTypes "types/auth";
import FilesTypes "types/files";
import SharesTypes "types/shares";
import AuditTypes "types/audit";
import AuthApi "mixins/auth-api";
import FilesApi "mixins/files-api";
import SharesApi "mixins/shares-api";
import AuditApi "mixins/audit-api";
import ApiDocMixin "mixins/api-doc";

actor {
  // Access-control state is re-initialized on every (re)start; the first
  // authenticated caller to sign in becomes admin. It cannot be supplied by the
  // migration chain (its initializer is not mo:core), so it is transient.
  transient let accessControlState = AccessControl.initState();

  // Sample principal used only to seed OQL schema discovery (dummy value).
  transient let anyP = Principal.fromText("aaaaa-aa");

  // Stable state, initialized by the migration chain (no inline initializers).
  // Files and shares are persistent maps keyed by their internal ids so that
  // uploads and shares survive upgrades.
  let users : Map.Map<Principal, AuthTypes.User>;
  let authFailedLogins : Map.Map<Principal, AuthTypes.FailedLogin>;
  let files : Map.Map<FilesTypes.FileId, FilesTypes.File>;
  let shares : Map.Map<SharesTypes.ShareId, SharesTypes.FileShare>;
  let shareState : { var nextShareId : Nat };
  let logs : List.List<AuditTypes.AuditLog>;
  let auditFailedLogins : List.List<AuditTypes.FailedLogin>;

  include MixinObjectStorage();
  include MixinAuthorization(accessControlState, null);
  include AuthApi(accessControlState, users, authFailedLogins, logs);
  include FilesApi(accessControlState, files, shares, logs);
  include SharesApi(accessControlState, shares, shareState, logs);
  include AuditApi(accessControlState, logs, authFailedLogins);
  include ApiDocMixin();
  include Expose({
    entities = [
      // users — sensitive account data (emails, hashes). Controller-only: the
      // Data Intelligence agent reads all, end users never read other users.
      users.toEntityManual("user", "User", "principal")
        .sample({ principal = anyP; name = ""; email = ""; passwordHash = ""; status = #active; createdAt = 0 })
        .payload("principal", func u = u.principal)
        .payload("name", func u = u.name)
        .payload("email", func u = u.email)
        .payload("status", func u = switch (u.status) { case (#active) "active"; case (#deactivated) "deactivated" })
        .payload("createdAt", func u = u.createdAt)
        .controllerOnly()
        .build(),
      // files — per-user metadata. Each user reads only their own rows; the
      // agent reads all for aggregates. The encrypted blob reference is omitted.
      files.toEntityManual("file", "File", "id")
        .sample({ id = 0; owner = anyP; originalFilename = ""; storedFilename = ""; blob = [].toBlob(); fileSize = 0; mimeType = ""; sha256Hash = ""; uploadedAt = 0 })
        .payload("id", func f = f.id)
        .payload("owner", func f = f.owner)
        .payload("originalFilename", func f = f.originalFilename)
        .payload("storedFilename", func f = f.storedFilename)
        .payload("fileSize", func f = f.fileSize)
        .payload("mimeType", func f = f.mimeType)
        .payload("sha256Hash", func f = f.sha256Hash)
        .payload("uploadedAt", func f = f.uploadedAt)
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      // shares — per-user share records. Owner reads their own; agent reads all.
      shares.toEntityManual("share", "FileShare", "id")
        .sample({ id = 0; fileId = 0; owner = anyP; sharedWith = anyP; shareToken = ""; permission = #view; expiresAt = null; revoked = false; createdAt = 0; decryptionKey = "" })
        .payload("id", func s = s.id)
        .payload("fileId", func s = s.fileId)
        .payload("owner", func s = s.owner)
        .payload("sharedWith", func s = s.sharedWith)
        .payload("shareToken", func s = s.shareToken)
        .payload("permission", func s = switch (s.permission) { case (#view) "view"; case (#download) "download" })
        .payload("expiresAt", func s = switch (s.expiresAt) { case (?t) t; case null 0 })
        .payload("revoked", func s = s.revoked)
        .payload("createdAt", func s = s.createdAt)
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      // audit logs — security-sensitive. Controller-only.
      logs.toEntityManual("auditLog", "AuditLog", "id")
        .sample({ id = 0; userId = anyP; action = #login; fileId = null; timestamp = 0; ipAddress = ""; details = "" })
        .payload("id", func l = l.id)
        .payload("userId", func l = l.userId)
        .payload("action", func l = switch (l.action) { case (#login) "login"; case (#logout) "logout"; case (#failedLogin) "failedLogin"; case (#upload) "upload"; case (#download) "download"; case (#delete) "delete"; case (#share) "share"; case (#linkCreate) "linkCreate"; case (#linkRevoke) "linkRevoke"; case (#unauthorizedAccess) "unauthorizedAccess" })
        .payload("fileId", func l = switch (l.fileId) { case (?f) f; case null 0 })
        .payload("timestamp", func l = l.timestamp)
        .payload("ipAddress", func l = l.ipAddress)
        .payload("details", func l = l.details)
        .controllerOnly()
        .build(),
      // failed logins — security-sensitive. Controller-only. All-primitive
      // record, so it rides the auto-derive path.
      auditFailedLogins.toEntity("failedLogin", "FailedLogin", "id")
        .sample({ id = 0; email = ""; ipAddress = ""; attemptedAt = 0 })
        .controllerOnly()
        .build(),
    ];
  });
};
