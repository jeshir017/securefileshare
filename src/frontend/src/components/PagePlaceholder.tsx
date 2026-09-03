import { ShieldCheck } from "lucide-react";

/**
 * Shared placeholder rendered by routes whose page bodies are built by
 * dedicated page tasks. Provides a consistent, intentional module shell so
 * every declared route resolves and the sidebar navigation works end to end.
 */
export function PagePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="grid-motif scanline relative overflow-hidden rounded-xl border bg-card shadow-subtle">
      <div className="relative flex flex-col items-start gap-4 p-8 md:p-12">
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
          <ShieldCheck className="size-6 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
          <span
            className="size-1.5 animate-status-pulse rounded-full bg-primary"
            aria-hidden
          />
          <span className="font-mono text-xs tracking-widest text-muted-foreground">
            MODULE {"//"} SECURE VAULT
          </span>
        </div>
      </div>
    </div>
  );
}
