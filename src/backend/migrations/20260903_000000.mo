import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";

module {
  type AccountStatus = {
    #active;
    #deactivated;
  };

  type User = {
    principal : Principal;
    name : Text;
    email : Text;
    passwordHash : Text;
    status : AccountStatus;
    createdAt : Int;
  };

  type AuthFailedLogin = {
    email : Text;
    attemptedAt : Int;
  };

  type File = {
    id : Nat;
    owner : Principal;
    originalFilename : Text;
    storedFilename : Text;
    blob : Blob;
    fileSize : Nat;
    mimeType : Text;
    sha256Hash : Text;
    uploadedAt : Int;
  };

  type SharePermission = {
    #view;
    #download;
  };

  type FileShare = {
    id : Nat;
    fileId : Nat;
    owner : Principal;
    sharedWith : Principal;
    shareToken : Text;
    permission : SharePermission;
    expiresAt : ?Int;
    revoked : Bool;
    createdAt : Int;
    decryptionKey : Text;
  };

  type AuditAction = {
    #login;
    #logout;
    #failedLogin;
    #upload;
    #download;
    #delete;
    #share;
    #linkCreate;
    #linkRevoke;
    #unauthorizedAccess;
  };

  type AuditLog = {
    id : Nat;
    userId : Principal;
    action : AuditAction;
    fileId : ?Nat;
    timestamp : Int;
    ipAddress : Text;
    details : Text;
  };

  type AuditFailedLogin = {
    id : Nat;
    email : Text;
    ipAddress : Text;
    attemptedAt : Int;
  };

  type OldActor = {};

  type NewActor = {
    users : Map.Map<Principal, User>;
    authFailedLogins : Map.Map<Principal, AuthFailedLogin>;
    files : Map.Map<Nat, File>;
    shares : Map.Map<Nat, FileShare>;
    shareState : { var nextShareId : Nat };
    logs : List.List<AuditLog>;
    auditFailedLogins : List.List<AuditFailedLogin>;
  };

  public func migration(_old : OldActor) : NewActor {
    {
      users = Map.empty();
      authFailedLogins = Map.empty();
      files = Map.empty();
      shares = Map.empty();
      shareState = { var nextShareId = 0 };
      logs = List.empty();
      auditFailedLogins = List.empty();
    };
  };
};
