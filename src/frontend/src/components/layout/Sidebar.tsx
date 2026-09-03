import { Link, useLocation } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  FileText,
  FolderLock,
  LayoutDashboard,
  Link2,
  LogOut,
  ScrollText,
  Share2,
  ShieldCheck,
  Upload,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { NavGroup } from "@/types";

const navGroups: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Upload File", href: "/upload", icon: Upload },
      { label: "My Files", href: "/files", icon: FolderLock },
      { label: "Shared With Me", href: "/shared-with-me", icon: Share2 },
      { label: "Share File", href: "/share", icon: Link2 },
      { label: "Shared Links", href: "/shared-links", icon: Link2 },
      { label: "Activity Logs", href: "/activity", icon: Activity },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "Admin Dashboard",
        href: "/admin",
        icon: ShieldCheck,
        adminOnly: true,
      },
      {
        label: "User Management",
        href: "/admin/users",
        icon: Users,
        adminOnly: true,
      },
      {
        label: "File Management",
        href: "/admin/files",
        icon: FileText,
        adminOnly: true,
      },
      {
        label: "Share Management",
        href: "/admin/shares",
        icon: Share2,
        adminOnly: true,
      },
      {
        label: "Security Logs",
        href: "/admin/security",
        icon: ScrollText,
        adminOnly: true,
      },
      {
        label: "Failed Logins",
        href: "/admin/failed-logins",
        icon: AlertTriangle,
        adminOnly: true,
      },
    ],
  },
];

export function Sidebar() {
  const { isAdmin, user, logoutApp, logoutPending } = useAuth();
  const { pathname } = useLocation();

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.adminOnly || isAdmin),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-center gap-2.5 border-b border-sidebar-border px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
          <ShieldCheck className="size-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-sm font-bold tracking-tight">Vault</p>
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground">
            SECURE FILE SHARING
          </p>
        </div>
      </div>

      <nav
        className="flex-1 space-y-6 overflow-y-auto px-3 py-4"
        aria-label="Main navigation"
      >
        {visibleGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-2 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              {group.label}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    item.href !== "/admin" &&
                    pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      data-ocid={`nav.${item.href.replaceAll("/", "_")}`}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 flex items-center gap-3 rounded-md px-3 py-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 font-display text-sm font-bold text-primary">
            {(user?.name ?? "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {user?.name ?? "User"}
            </p>
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              {isAdmin ? "Administrator" : "Standard user"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={() => void logoutApp()}
          disabled={logoutPending}
          data-ocid="logout_button"
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
