import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import AuthTypes "../types/auth";
import Types "../types/audit";

module {
  public func recordEvent(
    logs : List.List<Types.AuditLog>,
    userId : Principal,
    action : Types.AuditAction,
    fileId : ?Nat,
    ipAddress : Text,
    details : Text,
  ) : async () {
    logs.add({
      id = logs.size();
      userId;
      action;
      fileId;
      timestamp = Time.now();
      ipAddress;
      details;
    });
  };

  public func recordFailedLogin(
    failedLogins : List.List<Types.FailedLogin>,
    email : Text,
    ipAddress : Text,
  ) : async () {
    failedLogins.add({
      id = failedLogins.size();
      email;
      ipAddress;
      attemptedAt = Time.now();
    });
  };

  public func listUserActivity(
    logs : List.List<Types.AuditLog>,
    userId : Principal,
  ) : async [Types.AuditLog] {
    logs.toArray().filter(func log = log.userId == userId);
  };

  public func listAllLogs(logs : List.List<Types.AuditLog>) : async [Types.AuditLog] {
    logs.toArray();
  };

  public func listFailedLogins(
    failedLogins : List.List<Types.FailedLogin>,
  ) : async [Types.FailedLogin] {
    failedLogins.toArray();
  };

  // Reconcile the failed-login view with the real failed-login store. The
  // authoritative record of failed logins lives in the auth domain's
  // authFailedLogins map (keyed by principal); this converts it to the audit
  // view shape the frontend's failed-login monitoring page expects.
  public func listFailedLoginsFromAuth(
    failedLogins : Map.Map<Principal, AuthTypes.FailedLogin>,
  ) : [Types.FailedLogin] {
    var i = 0;
    failedLogins.entries().map(func (_, fl) {
      let entry : Types.FailedLogin = {
        id = i;
        email = fl.email;
        ipAddress = "";
        attemptedAt = fl.attemptedAt;
      };
      i += 1;
      entry;
    }).toArray();
  };
};
