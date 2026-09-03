import { AlertTriangle, ShieldAlert } from "lucide-react";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFailedLogins } from "@/hooks/useQueries";
import { formatDateTime } from "@/lib/format";

const SKELETON_KEYS = Array.from({ length: 6 }, (_, i) => i);

export function FailedLoginPage() {
  const failed = useFailedLogins();
  const list = failed.data ?? [];
  const sorted = [...list].sort((a, b) =>
    a.attemptedAt < b.attemptedAt ? 1 : -1,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          Failed Login Monitoring
        </h1>
        <p className="text-sm text-muted-foreground">
          Monitor failed sign-in attempts to identify suspicious activity and
          potential brute-force attacks.
        </p>
      </div>

      <Card className="shadow-subtle">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <ShieldAlert className="size-4 text-primary" />
            Failed Attempts
            <span className="ml-auto font-mono text-xs font-normal text-muted-foreground">
              {sorted.length} total
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {failed.isLoading ? (
            <div className="space-y-3" data-ocid="loading_state">
              {SKELETON_KEYS.map((k) => (
                <Skeleton key={k} className="h-12 w-full" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div
              className="flex flex-col items-center gap-2 py-12 text-center"
              data-ocid="empty_state"
            >
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <AlertTriangle className="size-5 text-muted-foreground" />
              </div>
              <p className="font-display text-sm font-semibold">
                No failed logins
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Failed sign-in attempts will be recorded here for security
                review.
              </p>
            </div>
          ) : (
            <Table data-ocid="failed_logins_table">
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Attempted</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((entry, i) => (
                  <TableRow
                    key={`${entry.email}-${entry.attemptedAt.toString()}`}
                    data-ocid={`failed.row.${i + 1}`}
                  >
                    <TableCell className="max-w-[220px] truncate font-medium">
                      {entry.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(entry.attemptedAt)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone="destructive" pulse>
                        Failed
                      </StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
