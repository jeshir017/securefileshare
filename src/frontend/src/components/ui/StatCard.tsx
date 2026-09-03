import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatTone = "primary" | "success" | "warning" | "destructive";

const iconTones: Record<StatTone, string> = {
  primary: "border-primary/30 bg-primary/10 text-primary",
  success:
    "border-[oklch(var(--success)/0.3)] bg-[oklch(var(--success)/0.1)] text-[oklch(var(--success))]",
  warning:
    "border-[oklch(var(--warning)/0.3)] bg-[oklch(var(--warning)/0.1)] text-[oklch(var(--warning))]",
  destructive: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "primary",
  className,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: StatTone;
  className?: string;
}) {
  return (
    <Card className={cn("shadow-subtle", className)}>
      <CardContent className="flex items-start justify-between gap-4 p-5 md:p-6">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-2 font-display text-2xl font-bold tracking-tight md:text-3xl">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {hint}
            </p>
          ) : null}
        </div>
        <div
          className={cn("shrink-0 rounded-lg border p-2.5", iconTones[tone])}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
