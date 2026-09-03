import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Storage "mo:caffeineai-object-storage/Storage";
import Time "mo:core/Time";
import Map "mo:core/Map";
import AccessControl "mo:caffeineai-authorization/access-control";
import FilesLib "../lib/files";
import SharesLib "../lib/shares";
import AuditLib "../lib/audit";
import Types "../types/files";
import SharesTypes "../types/shares";
import AuditTypes "../types/audit";

mixin (
  accessControlState : AccessControl.AccessControlState,
  files : Map.Map<Types.FileId, Types.File>,
  shares : Map.Map<SharesTypes.ShareId, SharesTypes.FileShare>,
  logs : List.List<AuditTypes.AuditLog>,
) {
  /// Lists the caller's own files.
  public query ({ caller }) func listMyFiles() : async [Types.FileView] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    FilesLib.listOwned(caller, files);
  };

  /// Uploads a file. The blob is stored via the object-storage extension; the
  /// backend records only metadata and a reference, never raw bytes or keys.
  public shared ({ caller }) func uploadFile(
    originalFilename : Text,
    storedFilename : Text,
    mimeType : Text,
    fileSize : Nat,
    sha256Hash : Text,
    blob : Storage.ExternalBlob,
  ) : async Types.FileView {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let file : Types.File = {
      id = files.size();
      owner = caller;
      originalFilename;
      storedFilename;
      blob;
      fileSize;
      mimeType;
      sha256Hash;
      uploadedAt = Time.now();
    };
    FilesLib.add(file, files);
    await AuditLib.recordEvent(logs, caller, #upload, ?file.id, "", "file upload");
    FilesLib.toView(file);
  };

  /// Downloads a file. The owner is always served; a share recipient is served
  /// only when the share is active (permission, not revoked, not expired) and
  /// the account is active. The recipient receives the file's decryption key
  /// so they can decrypt the blob.
  public shared ({ caller }) func downloadFile(id : Types.FileId) : async ?Types.DownloadResult {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    switch (FilesLib.getById(id, files)) {
      case (?file) {
        if (file.owner == caller) {
          await AuditLib.recordEvent(logs, caller, #download, ?id, "", "owner download");
          ?{ blob = file.blob; decryptionKey = null; sha256Hash = file.sha256Hash };
        } else {
          switch (SharesLib.findRecipientShare(shares, id, caller)) {
            case (?share) {
              await AuditLib.recordEvent(logs, caller, #download, ?id, "", "shared download");
              ?{ blob = file.blob; decryptionKey = ?share.decryptionKey; sha256Hash = file.sha256Hash };
            };
            case null {
              await AuditLib.recordEvent(logs, caller, #unauthorizedAccess, ?id, "", "unauthorized download attempt");
              null;
            };
          };
        };
      };
      case null { null };
    };
  };

  /// Deletes the caller's own file.
  public shared ({ caller }) func deleteFile(id : Types.FileId) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    switch (FilesLib.getById(id, files)) {
      case (?file) {
        if (file.owner != caller) {
          Runtime.trap("Unauthorized: You can only delete your own files");
        };
        FilesLib.remove(id, files);
        await AuditLib.recordEvent(logs, caller, #delete, ?id, "", "file delete");
        true;
      };
      case null { false };
    };
  };

  // Admin dashboard: list every file's metadata.
  public query ({ caller }) func listAllFiles() : async [Types.FileView] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    FilesLib.listAllFiles(files);
  };
};
