import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  public type UserRole = AccessControl.UserRole;

  public type AccountStatus = {
    #active;
    #deactivated;
  };

  public type User = {
    principal : Principal;
    name : Text;
    email : Text;
    passwordHash : Text;
    status : AccountStatus;
    createdAt : Int;
  };

  public type FailedLogin = {
    email : Text;
    attemptedAt : Int;
  };

  public type AuthError = {
    #emailTaken;
    #invalidCredentials;
    #accountDeactivated;
    #weakPassword;
    #notRegistered;
    #unauthorized;
  };
};
