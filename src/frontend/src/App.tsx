import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ActivityLogsPage } from "@/pages/ActivityLogsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { MyFilesPage } from "@/pages/MyFilesPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ShareFilePage } from "@/pages/ShareFilePage";
import { SharedLinksPage } from "@/pages/SharedLinksPage";
import { SharedWithMePage } from "@/pages/SharedWithMePage";
import { UploadPage } from "@/pages/UploadPage";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { FailedLoginPage } from "@/pages/admin/FailedLoginPage";
import { FileManagementPage } from "@/pages/admin/FileManagementPage";
import { SecurityLogsPage } from "@/pages/admin/SecurityLogsPage";
import { ShareManagementPage } from "@/pages/admin/ShareManagementPage";
import { UserManagementPage } from "@/pages/admin/UserManagementPage";

const rootRoute = createRootRoute({
  component: () => (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      enableSystem={false}
    >
      <ToastProvider />
      <Outlet />
    </ThemeProvider>
  ),
});

/* ------------------------------------------------------------------ */
/* Public shell (landing, login, register) — no sidebar                */
/* ------------------------------------------------------------------ */

const publicLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "public",
  component: () => (
    <div className="grid-motif relative flex min-h-screen flex-col bg-background">
      <header className="flex items-center gap-2.5 border-b border-border bg-card px-6 py-4">
        <div className="flex size-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
          <ShieldCheck className="size-5 text-primary" />
        </div>
        <div>
          <p className="font-display text-sm font-bold tracking-tight">Vault</p>
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground">
            SECURE FILE SHARING
          </p>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  ),
});

const landingRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/",
  component: LandingPage,
});

const loginRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/login",
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/register",
  component: RegisterPage,
});

/* ------------------------------------------------------------------ */
/* Authenticated app shell (sidebar + header)                          */
/* ------------------------------------------------------------------ */

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  component: AppLayout,
});

function AdminGuard({ children }: { children: ReactNode }) {
  const { isAdmin, authLoading } = useAuth();
  if (authLoading) {
    return (
      <div className="rounded-xl border bg-card p-8 shadow-subtle">
        <p className="text-sm text-muted-foreground">Verifying access…</p>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="grid-motif relative overflow-hidden rounded-xl border bg-card p-8 shadow-subtle">
        <div className="relative">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Access Denied
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            This area is restricted to administrators. Your role does not have
            permission to view this page.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const uploadRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/upload",
  component: UploadPage,
});

const filesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/files",
  component: MyFilesPage,
});

const sharedWithMeRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/shared-with-me",
  component: SharedWithMePage,
});

const shareRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/share",
  component: ShareFilePage,
});

const sharedLinksRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/shared-links",
  component: SharedLinksPage,
});

const activityRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/activity",
  component: ActivityLogsPage,
});

/* ------------------------- Admin routes --------------------------- */

const adminDashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/admin",
  component: () => (
    <AdminGuard>
      <AdminDashboardPage />
    </AdminGuard>
  ),
});

const adminUsersRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/admin/users",
  component: () => (
    <AdminGuard>
      <UserManagementPage />
    </AdminGuard>
  ),
});

const adminFilesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/admin/files",
  component: () => (
    <AdminGuard>
      <FileManagementPage />
    </AdminGuard>
  ),
});

const adminSharesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/admin/shares",
  component: () => (
    <AdminGuard>
      <ShareManagementPage />
    </AdminGuard>
  ),
});

const adminSecurityRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/admin/security",
  component: () => (
    <AdminGuard>
      <SecurityLogsPage />
    </AdminGuard>
  ),
});

const adminFailedLoginsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/admin/failed-logins",
  component: () => (
    <AdminGuard>
      <FailedLoginPage />
    </AdminGuard>
  ),
});

/* ------------------------------------------------------------------ */

const routeTree = rootRoute.addChildren([
  publicLayoutRoute.addChildren([landingRoute, loginRoute, registerRoute]),
  appLayoutRoute.addChildren([
    dashboardRoute,
    uploadRoute,
    filesRoute,
    sharedWithMeRoute,
    shareRoute,
    sharedLinksRoute,
    activityRoute,
    adminDashboardRoute,
    adminUsersRoute,
    adminFilesRoute,
    adminSharesRoute,
    adminSecurityRoute,
    adminFailedLoginsRoute,
  ]),
]);

const router = createRouter({ routeTree });

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
