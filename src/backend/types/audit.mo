module {
  public type AuditAction = {
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

  public type AuditLog = {
    id : Nat;
    userId : Principal;
    action : AuditAction;
    fileId : ?Nat;
    timestamp : Int;
    ipAddress : Text;
    details : Text;
  };

  public type FailedLogin = {
    id : Nat;
    email : Text;
    ipAddress : Text;
    attemptedAt : Int;
  };
};
