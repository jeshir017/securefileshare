/**
 * Shared formatting helpers. Backend timestamps are nanosecond bigints and must
 * be converted through `timestampToDate` before any JavaScript Date operation.
 */

/** Convert a nanosecond backend timestamp to a Date, or null when invalid. */
export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format a byte count as a human-readable size string. */
export function formatBytes(bytes: bigint | number): string {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return "—";
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = n;
  let unit = "B";
  for (const next of units) {
    value /= 1024;
    unit = next;
    if (value < 1024) break;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${unit}`;
}

/** Format a backend timestamp as a short date. */
export function formatDate(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Format a backend timestamp as a date and time. */
export function formatDateTime(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Truncate a long hash/token to a readable prefix…suffix form. */
export function truncateHash(hash: string, start = 8, end = 8): string {
  if (!hash) return "—";
  if (hash.length <= start + end) return hash;
  return `${hash.slice(0, start)}…${hash.slice(-end)}`;
}

/** Shorten a principal id for display. */
export function formatPrincipal(principal: string): string {
  if (!principal) return "—";
  if (principal.length <= 16) return principal;
  return `${principal.slice(0, 8)}…${principal.slice(-6)}`;
}
