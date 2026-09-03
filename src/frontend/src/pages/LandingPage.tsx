import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  FileLock2,
  Fingerprint,
  Lock,
  ScrollText,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { motion } from "motion/react";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Lock,
    title: "End-to-end encryption",
    description:
      "Files are encrypted with AES-256-GCM in your browser before they ever reach the vault. Keys never leave your device.",
  },
  {
    icon: Fingerprint,
    title: "Granular access control",
    description:
      "Share with specific users, set view or download permissions, and expire links on your schedule.",
  },
  {
    icon: ScrollText,
    title: "Immutable audit logging",
    description:
      "Every upload, share, and access is recorded with SHA-256 integrity verification for full accountability.",
  },
];

export function LandingPage() {
  return (
    <div className="flex flex-col gap-10 py-4">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="scanline relative overflow-hidden rounded-xl border bg-card p-8 shadow-subtle"
      >
        <div className="relative flex flex-col items-start gap-5">
          <StatusBadge
            tone="primary"
            pulse
            mono
            data-ocid="landing.status_badge"
          >
            SYSTEM {"//"} SECURE
          </StatusBadge>
          <h1 className="font-display text-3xl leading-tight font-bold tracking-tight md:text-4xl">
            Encrypted file sharing,{" "}
            <span className="text-gradient">locked down.</span>
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Vault lets you share files with confidence. Every file is encrypted
            end-to-end, access is controlled per recipient, and every action is
            written to an auditable security log.
          </p>
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" data-ocid="landing.get_started_button">
              <Link to="/register">
                <UserPlus className="size-4" />
                Get started
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              data-ocid="landing.sign_in_button"
            >
              <Link to="/login">
                Sign in
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Security strip */}
      <section className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <ShieldCheck className="size-4 shrink-0 text-primary" />
          <span className="truncate font-mono text-[11px] tracking-widest text-muted-foreground">
            AES-256-GCM {"//"} SHA-256
          </span>
        </div>
        <StatusBadge tone="success" pulse data-ocid="landing.online_badge">
          Online
        </StatusBadge>
      </section>

      {/* Features */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-bold tracking-tight">
          Built for security teams
        </h2>
        <div className="flex flex-col gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="shadow-subtle">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="shrink-0 rounded-lg border border-primary/30 bg-primary/10 p-2.5">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-bold tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-xl border border-primary/30 bg-primary/10 p-6 text-center shadow-subtle">
        <FileLock2 className="mx-auto size-8 text-primary" />
        <h2 className="mt-3 font-display text-xl font-bold tracking-tight">
          Ready to secure your files?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Create a free account and start sharing with confidence.
        </p>
        <Button
          asChild
          className="mt-5"
          data-ocid="landing.create_account_button"
        >
          <Link to="/register">
            Create account
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
