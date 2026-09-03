import { Navigate, Outlet } from "@tanstack/react-router";
import { Menu, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";

export function AppLayout() {
  const { isAuthenticated, isInitializing } = useAuth();
  const isMobile = useIsMobile();
  const [navOpen, setNavOpen] = useState(false);

  // Close the mobile nav whenever the route changes.
  useEffect(() => {
    setNavOpen(false);
  }, []);

  if (!isInitializing && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      {!isMobile ? (
        <aside className="fixed inset-y-0 left-0 z-30 w-64 border-r border-sidebar-border">
          <Sidebar />
        </aside>
      ) : null}

      {/* Mobile nav */}
      {isMobile ? (
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="fixed top-4 left-4 z-40"
              aria-label="Open navigation"
              data-ocid="open_nav_button"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
              <SheetDescription>Vault navigation</SheetDescription>
            </SheetHeader>
            <Sidebar />
          </SheetContent>
        </Sheet>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-subtle md:px-8">
          {isMobile ? <div className="w-9" /> : null}
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" />
            <span className="font-mono text-xs tracking-widest uppercase">
              Encrypted vault
            </span>
          </div>
          <Separator orientation="vertical" className="h-5" />
          <span className="hidden font-mono text-xs tracking-widest text-muted-foreground sm:inline">
            AES-256-GCM {"//"} SHA-256
          </span>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-border bg-muted/40 px-4 py-4 md:px-8">
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                window.location.hostname,
              )}`}
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
