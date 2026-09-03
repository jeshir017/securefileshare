import { ScrollText } from "lucide-react";

import { AuditAction } from "@/backend";
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
import { useAllLogs } from "@/hooks/useQueries";
import { formatDateTime, formatPrincipal } from "@/lib/format";

const SKELETON_KEYS = [
  "skeleton-1",
  "skeleton-2",
  "skeleton-3",
  "skeleton-4",
  "skeleton-5",
  "skeleton-6",
  "skeleton-7",
  "skeleton-8",
];

const actionTone: Record<
  AuditAction,
  "success" | "warning" | "destructive" | "neutral" | "primary"
> = {
  [AuditAction.upload]: "primary",
  [AuditAction.download]: "success",
  [AuditAction.share]: "primary",
  [AuditAction.linkCreate]: "primary",
  [AuditAction.linkRevoke]: "warning",
  [AuditAction.login]: "success",
  [AuditAction.logout]: "neutral",
  [AuditAction.failedLogin]: "destructive",
  [AuditAction.delete_]: "destructive",
  [AuditAction.unauthorizedAccess]: "destructive",
};

const actionLabel: Record<AuditAction, string> = {
  [AuditAction.upload]: "Upload",
  [AuditAction.download]: "Download",
  [AuditAction.share]: "Share",
  [AuditAction.linkCreate]: "Link created",
  [AuditAction.linkRevoke]: "Link revoked",
  [AuditAction.login]: "Login",
  [AuditAction.logout]: "Logout",
  [AuditAction.failedLogin]: "Failed login",
  [AuditAction.delete_]: "Delete",
  [AuditAction.unauthorizedAccess]: "Unauthorized access",
};

export function SecurityLogsPage() {
  const logs = useAllLogs();
  const logList = logs.data ?? [];
  const sorted = [...logList].sort((a, b) =>
    a.timestamp < b.timestamp ? 1 : -1,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          Security Logs
        </h1>
        <p className="text-sm text-muted-foreground">
          Full audit trail of security events across the platform, including
          user, action, file, timestamp, and IP address.
        </p>
      </div>

      <Card className="shadow-subtle">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <ScrollText className="size-4 text-primary" />
            Audit Trail
            <span className="ml-auto font-mono text-xs font-normal text-muted-foreground">
              {sorted.length} events
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.isLoading ? (
            <div className="space-y-3" data-ocid="loading_state">
              {SKELETON_KEYS.map((key) => (
                <Skeleton key={key} className="h-12 w-full" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div
              className="flex flex-col items-center gap-2 py-12 text-center"
              data-ocid="empty_state"
            >
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <ScrollText className="size-5 text-muted-foreground" />
              </div>
              <p className="font-display text-sm font-semibold">
                No events logged
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Security events will appear here as users interact with the
                vault.
              </p>
            </div>
          ) : (
            <Table data-ocid="logs_table">
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((log, i) => (
                  <TableRow
                    key={log.id.toString()}
                    data-ocid={`log.row.${i + 1}`}
                  >
                    <TableCell>
                      <StatusBadge tone={actionTone[log.action]} mono>
                        {actionLabel[log.action]}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatPrincipal(log.userId.toString())}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.fileId !== undefined
                        ? `#${log.fileId.toString()}`
                        : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.ipAddress || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(log.timestamp)}
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
