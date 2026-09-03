import { ScrollText } from "lucide-react";

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
import { useMyActivity } from "@/hooks/useQueries";
import { auditActionLabel, auditActionTone } from "@/lib/audit";
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

export function ActivityLogsPage() {
  const logs = useMyActivity();
  const logList = logs.data ?? [];
  const sorted = [...logList].sort((a, b) =>
    a.timestamp < b.timestamp ? 1 : -1,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          Activity Logs
        </h1>
        <p className="text-sm text-muted-foreground">
          A record of your own security events, including the action taken,
          details, timestamp, and originating IP address.
        </p>
      </div>

      <Card className="shadow-subtle">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <ScrollText className="size-4 text-primary" />
            Your Activity
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
                No activity yet
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Security events will appear here as you interact with the vault.
              </p>
            </div>
          ) : (
            <Table data-ocid="activity_logs_table">
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((log, i) => (
                  <TableRow
                    key={log.id.toString()}
                    data-ocid={`activity.row.${i + 1}`}
                  >
                    <TableCell>
                      <StatusBadge tone={auditActionTone(log.action)} mono>
                        {auditActionLabel(log.action)}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate text-muted-foreground">
                      {log.details || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatPrincipal(log.ipAddress)}
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
