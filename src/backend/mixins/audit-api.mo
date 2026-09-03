import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import AuditLib "../lib/audit";
import Types "../types/audit";
import AuthTypes "../types/auth";

mixin (
  accessControlState : AccessControl.AccessControlState,
  logs : List.List<Types.AuditLog>,
  authFailedLogins : Map.Map<Principal, AuthTypes.FailedLogin>,
) {
  public shared ({ caller }) func getMyActivity() : async [Types.AuditLog] {
    await AuditLib.listUserActivity(logs, caller);
  };

  public shared ({ caller }) func getAllLogs() : async [Types.AuditLog] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view security logs");
    };
    await AuditLib.listAllLogs(logs);
  };

  public shared ({ caller }) func getFailedLogins() : async [Types.FailedLogin] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view failed logins");
    };
    AuditLib.listFailedLoginsFromAuth(authFailedLogins);
  };
};
