import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import SharesLib "../lib/shares";
import AuditLib "../lib/audit";
import Types "../types/shares";
import AuditTypes "../types/audit";

mixin (
  accessControlState : AccessControl.AccessControlState,
  shares : Map.Map<Types.ShareId, Types.FileShare>,
  state : { var nextShareId : Nat },
  logs : List.List<AuditTypes.AuditLog>,
) {
  // Owner shares a file with another registered user, generating a secure
  // random share token (never exposing database IDs). The decryptionKey is the
  // file's AES-256 data key, stored so the recipient can decrypt on download.
  public shared ({ caller }) func createShare(
    fileId : Types.FileId,
    sharedWith : Principal,
    permission : Types.SharePermission,
    expiresAt : ?Types.Timestamp,
    decryptionKey : Text,
  ) : async Types.ShareView {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can share files");
    };
    let view = SharesLib.createShare(shares, state, fileId, caller, sharedWith, permission, expiresAt, decryptionKey);
    await AuditLib.recordEvent(logs, caller, #share, ?fileId, "", "file shared");
    await AuditLib.recordEvent(logs, caller, #linkCreate, ?fileId, "", "share link created");
    view;
  };

  // Owner lists their active shared links.
  public query ({ caller }) func listOwnerShares() : async [Types.ShareView] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can view their shares");
    };
    SharesLib.listOwnerShares(shares, caller);
  };

  // Owner revokes a share at any time.
  public shared ({ caller }) func revokeShare(shareId : Types.ShareId) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can revoke shares");
    };
    let revoked = SharesLib.revokeShare(shares, shareId, caller);
    if (revoked) {
      await AuditLib.recordEvent(logs, caller, #linkRevoke, null, "", "share link revoked");
    };
    revoked;
  };

  // Recipient lists the files shared with them.
  public query ({ caller }) func listSharesForUser() : async [Types.ShareView] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can view shared files");
    };
    SharesLib.listSharesForUser(shares, caller);
  };

  // Authorization check before download: authenticated, permitted, not
  // expired, not revoked, and the account is active. Authentication and
  // account-status checks are enforced here via the access-control guard; the
  // share-level checks (recipient, permission, revocation, expiry) are
  // delegated to the shares lib.
  public query ({ caller }) func checkDownloadAccess(shareId : Types.ShareId) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can download files");
    };
    SharesLib.checkDownloadAccess(shares, shareId, caller);
  };

  // Admin dashboard: list every share record.
  public query ({ caller }) func listAllShares() : async [Types.ShareView] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    SharesLib.listAllShares(shares);
  };
};
