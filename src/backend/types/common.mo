import Principal "mo:core/Principal";

module {
  /// Unique identifier for a user: their Internet Identity principal.
  public type UserId = Principal;

  /// Unix timestamp in nanoseconds since the epoch.
  public type Timestamp = Int;
};
