import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone =
  | "success"
  | "warning"
  | "destructive"
  | "neutral"
  | "primary";

const toneStyles: Record<StatusTone, string> = {
  success:
    "text-[oklch(var(--success))] border-[oklch(var(--success)/0.3)] bg-[oklch(var(--success)/0.1)]",
  warning:
    "text-[oklch(var(--warning))] border-[oklch(var(--warning)/0.3)] bg-[oklch(var(--warning)/0.1)]",
  destructive: "text-destructive border-destructive/30 bg-destructive/10",
  neutral: "text-muted-foreground border-border bg-muted/40",
  primary: "text-primary border-primary/30 bg-primary/10",
};

const dotStyles: Record<StatusTone, string> = {
  success: "bg-[oklch(var(--success))]",
  warning: "bg-[oklch(var(--warning))]",
  destructive: "bg-destructive",
  neutral: "bg-muted-foreground",
  primary: "bg-primary",
};

export function StatusBadge({
  tone = "neutral",
  pulse = false,
  mono = false,
  children,
  className,
}: {
  tone?: StatusTone;
  pulse?: boolean;
  mono?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full", toneStyles[tone], className)}
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          dotStyles[tone],
          pulse && "animate-status-pulse",
        )}
        aria-hidden
      />
      <span className={cn(mono && "font-mono")}>{children}</span>
    </Badge>
  );
}
