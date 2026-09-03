import { AuditAction } from "@/backend";
import type { StatusTone } from "@/components/ui/StatusBadge";

/** Human-readable label for an audit action. */
export function auditActionLabel(action: AuditAction): string {
  switch (action) {
    case AuditAction.upload:
      return "File uploaded";
    case AuditAction.download:
      return "File downloaded";
    case AuditAction.delete_:
      return "File deleted";
    case AuditAction.share:
      return "File shared";
    case AuditAction.linkCreate:
      return "Share link created";
    case AuditAction.linkRevoke:
      return "Share link revoked";
    case AuditAction.login:
      return "Signed in";
    case AuditAction.logout:
      return "Signed out";
    case AuditAction.failedLogin:
      return "Failed sign-in attempt";
    case AuditAction.unauthorizedAccess:
      return "Unauthorized access attempt";
    default:
      return action;
  }
}

/** Status tone used to render an audit action badge. */
export function auditActionTone(action: AuditAction): StatusTone {
  switch (action) {
    case AuditAction.upload:
    case AuditAction.download:
    case AuditAction.login:
      return "success";
    case AuditAction.share:
    case AuditAction.linkCreate:
      return "primary";
    case AuditAction.linkRevoke:
    case AuditAction.logout:
      return "neutral";
    case AuditAction.failedLogin:
    case AuditAction.unauthorizedAccess:
      return "destructive";
    case AuditAction.delete_:
      return "warning";
    default:
      return "neutral";
  }
}
