import type { LucideIcon } from "lucide-react";

import type {
  AccountStatus,
  AuditAction,
  AuditLog,
  AuthError,
  FileId,
  FileView,
  ShareId,
  SharePermission,
  ShareView,
  User,
  UserRole,
} from "@/backend";

export type {
  AccountStatus,
  AuditAction,
  AuditLog,
  AuthError,
  FileId,
  FileView,
  ShareId,
  SharePermission,
  ShareView,
  User,
  UserRole,
};

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};
