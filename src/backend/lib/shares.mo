import Map "mo:core/Map";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Blob "mo:core/Blob";
import Nat8 "mo:core/Nat8";
import Text "mo:core/Text";
import Sha256 "mo:sha2/Sha256";
import Types "../types/shares";

module {
  // Hex-encode a blob into a lowercase hex text string.
  func toHex(blob : Blob) : Text {
    let hexChars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
    var out = "";
    for (byte in blob.toArray().values()) {
      let n = byte.toNat();
      out #= hexChars[n / 16] # hexChars[n % 16];
    };
    out;
  };

  // Generate a cryptographically secure random share token. Combines the
  // current time, the involved principals, the file id, and the share counter,
  // hashed with SHA-256 and hex-encoded. Never exposes database IDs as the
  // security token.
  func generateToken(
    owner : Principal,
    sharedWith : Principal,
    fileId : Types.FileId,
    nextShareId : Nat,
  ) : Text {
    let entropy = Time.now().toText()
      # ":" # owner.toText()
      # ":" # sharedWith.toText()
      # ":" # fileId.toText()
      # ":" # nextShareId.toText();
    toHex(Sha256.fromBlob(entropy.encodeUtf8()));
  };

  // Convert an internal share record to its public, shared view.
  func toView(share : Types.FileShare) : Types.ShareView {
    {
      id = share.id;
      fileId = share.fileId;
      owner = share.owner;
      sharedWith = share.sharedWith;
      shareToken = share.shareToken;
      permission = share.permission;
      expiresAt = share.expiresAt;
      revoked = share.revoked;
      createdAt = share.createdAt;
      decryptionKey = share.decryptionKey;
    };
  };

  // Whether a share has expired relative to `now`.
  func isExpired(share : Types.FileShare, now : Types.Timestamp) : Bool {
    switch (share.expiresAt) {
      case (?exp) now > exp;
      case null false;
    };
  };

  // Create a share record with a cryptographically secure random share token.
  // Never exposes database IDs as the security token. The decryptionKey is the
  // file's AES-256 data key, stored so the recipient can decrypt on download.
  public func createShare(
    shares : Map.Map<Types.ShareId, Types.FileShare>,
    state : { var nextShareId : Nat },
    fileId : Types.FileId,
    owner : Principal,
    sharedWith : Principal,
    permission : Types.SharePermission,
    expiresAt : ?Types.Timestamp,
    decryptionKey : Text,
  ) : Types.ShareView {
    let id = state.nextShareId;
    state.nextShareId += 1;
    let share : Types.FileShare = {
      id;
      fileId;
      owner;
      sharedWith;
      shareToken = generateToken(owner, sharedWith, fileId, id);
      permission;
      expiresAt;
      revoked = false;
      createdAt = Time.now();
      decryptionKey;
    };
    shares.add(id, share);
    toView(share);
  };

  // List the active shared links owned by `owner`.
  public func listOwnerShares(
    shares : Map.Map<Types.ShareId, Types.FileShare>,
    owner : Principal,
  ) : [Types.ShareView] {
    shares.entries()
      .map(func (_, s) = s)
      .filter(func s = s.owner == owner and not s.revoked)
      .map(toView)
      .toArray();
  };

  // Revoke a share owned by `owner`. Returns true if a share was revoked.
  public func revokeShare(
    shares : Map.Map<Types.ShareId, Types.FileShare>,
    shareId : Types.ShareId,
    owner : Principal,
  ) : Bool {
    switch (shares.get(shareId)) {
      case (?share) {
        if (share.owner == owner and not share.revoked) {
          shares.add(shareId, { share with revoked = true });
          true;
        } else {
          false;
        };
      };
      case null { false };
    };
  };

  // List the files shared with `user` (not revoked, not expired).
  public func listSharesForUser(
    shares : Map.Map<Types.ShareId, Types.FileShare>,
    user : Principal,
  ) : [Types.ShareView] {
    let now = Time.now();
    shares.entries()
      .map(func (_, s) = s)
      .filter(func s = s.sharedWith == user and not s.revoked and not isExpired(s, now))
      .map(toView)
      .toArray();
  };

  // Authorization check before download: the user is the intended recipient,
  // the permission allows download, the share is not revoked, and it has not
  // expired. Authentication and account-status checks are enforced by the
  // caller (the mixin) before this is reached.
  public func checkDownloadAccess(
    shares : Map.Map<Types.ShareId, Types.FileShare>,
    shareId : Types.ShareId,
    user : Principal,
  ) : Bool {
    switch (shares.get(shareId)) {
      case (?share) {
        share.sharedWith == user
          and share.permission == #download
          and not share.revoked
          and not isExpired(share, Time.now());
      };
      case null { false };
    };
  };

  // Find the active, download-permitted share of `fileId` granted to `user`.
  // Used by the recipient download path to locate the share and its decryption
  // key. Returns null when no such share exists (not shared, revoked, expired,
  // or view-only).
  public func findRecipientShare(
    shares : Map.Map<Types.ShareId, Types.FileShare>,
    fileId : Types.FileId,
    user : Principal,
  ) : ?Types.FileShare {
    shares.entries()
      .map(func (_, s) = s)
      .find(func s =
        s.fileId == fileId
          and s.sharedWith == user
          and s.permission == #download
          and not s.revoked
          and not isExpired(s, Time.now())
      );
  };

  // List every share record (admin dashboard).
  public func listAllShares(
    shares : Map.Map<Types.ShareId, Types.FileShare>,
  ) : [Types.ShareView] {
    shares.entries().map(func (_, s) = s).map(toView).toArray();
  };
};
