import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Result "mo:core/Result";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Sha256 "mo:sha2/Sha256";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/auth";

module {
  public type User = Types.User;
  public type AccountStatus = Types.AccountStatus;
  public type FailedLogin = Types.FailedLogin;
  public type AuthError = Types.AuthError;

  // Application-level salt mixed into every password hash. The hash is
  // SHA-256(salt # password); the salt prevents trivial rainbow-table reuse
  // across apps while the password itself is never stored in plaintext.
  let SALT = "caffeine-secure-file-sharing-salt-v1";

  let HEX : [Text] = [
    "0", "1", "2", "3", "4", "5", "6", "7",
    "8", "9", "a", "b", "c", "d", "e", "f",
  ];

  func toHex(blob : Blob) : Text {
    var out = "";
    for (b in blob.vals()) {
      let hi = b >> 4;
      let lo = b & 15;
      out #= HEX[hi.toNat()] # HEX[lo.toNat()];
    };
    out
  };

  public func validatePasswordStrength(password : Text) : Bool {
    if (password.size() < 8) { return false };
    var hasUpper = false;
    var hasLower = false;
    var hasDigit = false;
    var hasSymbol = false;
    for (c in password.chars()) {
      if (c >= 'A' and c <= 'Z') { hasUpper := true }
      else if (c >= 'a' and c <= 'z') { hasLower := true }
      else if (c >= '0' and c <= '9') { hasDigit := true }
      else { hasSymbol := true };
    };
    hasUpper and hasLower and hasDigit and hasSymbol
  };

  public func hashPassword(password : Text) : Text {
    toHex(Sha256.fromBlob((SALT # password).encodeUtf8()))
  };

  public func verifyPassword(password : Text, passwordHash : Text) : Bool {
    hashPassword(password) == passwordHash
  };

  public func register(
    users : Map.Map<Principal, User>,
    caller : Principal,
    name : Text,
    email : Text,
    password : Text,
  ) : Result.Result<User, AuthError> {
    if (not validatePasswordStrength(password)) {
      return #err(#weakPassword);
    };
    let emailLower = email.toLower();
    let exists = users.entries().any(func (_, u) = u.email.toLower() == emailLower);
    if (exists) {
      return #err(#emailTaken);
    };
    let user : User = {
      principal = caller;
      name;
      email;
      passwordHash = hashPassword(password);
      status = #active;
      createdAt = Time.now();
    };
    users.add(caller, user);
    #ok(user)
  };

  public func authenticate(
    users : Map.Map<Principal, User>,
    caller : Principal,
    email : Text,
    password : Text,
  ) : Result.Result<User, AuthError> {
    ignore caller;
    let emailLower = email.toLower();
    switch (users.entries().find(func (_, u) = u.email.toLower() == emailLower)) {
      case (?(_, user)) {
        if (not verifyPassword(password, user.passwordHash)) {
          return #err(#invalidCredentials);
        };
        if (user.status == #deactivated) {
          return #err(#accountDeactivated);
        };
        #ok(user);
      };
      case null { #err(#invalidCredentials) };
    };
  };

  public func isAccountActive(user : User) : Bool {
    user.status == #active
  };

  public func setAccountStatus(
    users : Map.Map<Principal, User>,
    target : Principal,
    status : AccountStatus,
  ) : Result.Result<(), AuthError> {
    switch (users.get(target)) {
      case (?user) {
        let updated : User = { user with status = status };
        users.add(target, updated);
        #ok(());
      };
      case null { #err(#notRegistered) };
    };
  };

  public func recordFailedLogin(
    failedLogins : Map.Map<Principal, FailedLogin>,
    caller : Principal,
    email : Text,
  ) : () {
    failedLogins.add(caller, { email; attemptedAt = Time.now() });
  };

  public func listFailedLogins(failedLogins : Map.Map<Principal, FailedLogin>) : [FailedLogin] {
    failedLogins.entries().map(func (_, fl) = fl).toArray()
  };

  // List every registered user (admin dashboard).
  public func listAllUsers(users : Map.Map<Principal, User>) : [User] {
    users.entries().map(func (_, u) = u).toArray()
  };

  public func requireRole(
    accessControlState : AccessControl.AccessControlState,
    caller : Principal,
    requiredRole : AccessControl.UserRole,
  ) : () {
    if (not AccessControl.hasPermission(accessControlState, caller, requiredRole)) {
      Runtime.trap("Unauthorized");
    };
  };
};
