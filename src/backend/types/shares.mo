module {
  public type ShareId = Nat;
  public type FileId = Nat;
  public type Timestamp = Int;

  public type SharePermission = {
    #view;
    #download;
  };

  // Internal share record (may hold mutable state). The decryptionKey is the
  // file's AES-256 data key, supplied by the owner at share time so the
  // recipient can decrypt the file on download. It is never exposed to the
  // frontend except to the authorized recipient at download time.
  public type FileShare = {
    id : ShareId;
    fileId : FileId;
    owner : Principal;
    sharedWith : Principal;
    shareToken : Text;
    permission : SharePermission;
    expiresAt : ?Timestamp;
    revoked : Bool;
    createdAt : Timestamp;
    decryptionKey : Text;
  };

  // Public, shared view of a share record (no var fields).
  public type ShareView = {
    id : ShareId;
    fileId : FileId;
    owner : Principal;
    sharedWith : Principal;
    shareToken : Text;
    permission : SharePermission;
    expiresAt : ?Timestamp;
    revoked : Bool;
    createdAt : Timestamp;
    decryptionKey : Text;
  };
};
