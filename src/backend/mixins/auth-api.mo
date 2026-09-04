import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Result "mo:core/Result";
import AccessControl "mo:caffeineai-authorization/access-control";
import AuthLib "../lib/auth";
import AuditLib "../lib/audit";
import Types "../types/auth";
import AuditTypes "../types/audit";

mixin (
  accessControlState : AccessControl.AccessControlState,
  users : Map.Map<Principal, Types.User>,
  failedLogins : Map.Map<Principal, Types.FailedLogin>,
  logs : List.List<AuditTypes.AuditLog>,
) {
  public shared ({ caller }) func register(
    name : Text,
    email : Text,
    password : Text,
  ) : async Result.Result<Types.User, Types.AuthError> {
    let result = AuthLib.register(users, caller, name, email, password);
    switch (result) {
      case (#ok(_)) {
        // Register the caller into the access-control role map so user-gated
        // operations (uploadFile, listMyFiles, ...) are authorized regardless
        // of frontend timing. The first caller becomes admin; later callers
        // become #user.
        AccessControl.initialize(accessControlState, caller);
      };
      case (#err(_)) {};
    };
    result
  };

  public shared ({ caller }) func login(
    email : Text,
    password : Text,
  ) : async Result.Result<Types.User, Types.AuthError> {
    let result = AuthLib.authenticate(users, caller, email, password);
    switch (result) {
      case (#err(_)) {
        AuthLib.recordFailedLogin(failedLogins, caller, email);
        await AuditLib.recordEvent(logs, caller, #failedLogin, null, "", "failed login");
      };
      case (#ok(_)) {
        // Ensure the caller is registered in the access-control role map so
        // user-gated operations are authorized even if the frontend never
        // called _initialize_access_control.
        AccessControl.initialize(accessControlState, caller);
        await AuditLib.recordEvent(logs, caller, #login, null, "", "login");
      };
    };
    result
  };

  public shared ({ caller }) func logout() : async () {
    await AuditLib.recordEvent(logs, caller, #logout, null, "", "logout");
  };

  public query ({ caller }) func getCallerUser() : async ?Types.User {
    users.get(caller)
  };

  public shared ({ caller }) func setAccountStatus(
    target : Principal,
    status : Types.AccountStatus,
  ) : async Result.Result<(), Types.AuthError> {
    AuthLib.requireRole(accessControlState, caller, #admin);
    // Keep the access-control role in sync with the account status so a
    // deactivated user loses the #user role (and therefore all file access).
    switch (status) {
      case (#deactivated) {
        AccessControl.assignRole(accessControlState, caller, target, #guest);
      };
      case (#active) {
        AccessControl.assignRole(accessControlState, caller, target, #user);
      };
    };
    AuthLib.setAccountStatus(users, target, status)
  };

  public query ({ caller }) func listFailedLogins() : async [Types.FailedLogin] {
    AuthLib.requireRole(accessControlState, caller, #admin);
    AuthLib.listFailedLogins(failedLogins)
  };

  // Admin dashboard: list every registered user.
  public query ({ caller }) func listAllUsers() : async [Types.User] {
    AuthLib.requireRole(accessControlState, caller, #admin);
    AuthLib.listAllUsers(users)
  };
};
