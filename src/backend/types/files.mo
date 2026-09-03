import Storage "mo:caffeineai-object-storage/Storage";

module {
  /// Unique internal identifier for a stored file.
  public type FileId = Nat;

  /// Metadata record for an uploaded file. The backend stores only metadata and
  /// a reference to the encrypted blob; it never stores raw file bytes or
  /// encryption keys.
  public type File = {
    id : FileId;
    owner : Principal;
    originalFilename : Text;
    storedFilename : Text;
    blob : Storage.ExternalBlob;
    fileSize : Nat;
    mimeType : Text;
    sha256Hash : Text;
    uploadedAt : Int;
  };

  /// Public (shared) view of a file, safe to return across the API boundary.
  public type FileView = {
    id : FileId;
    originalFilename : Text;
    storedFilename : Text;
    fileSize : Nat;
    mimeType : Text;
    sha256Hash : Text;
    uploadedAt : Int;
  };

  /// Result of a download. The blob is the encrypted file bytes; decryptionKey
  /// is present only when the file is served to a share recipient (the owner
  /// already holds their own key in the browser vault). sha256Hash is the
  /// file's stored SHA-256 integrity hash so the recipient can verify the
  /// decrypted bytes match the original upload.
  public type DownloadResult = {
    blob : Storage.ExternalBlob;
    decryptionKey : ?Text;
    sha256Hash : Text;
  };
};
