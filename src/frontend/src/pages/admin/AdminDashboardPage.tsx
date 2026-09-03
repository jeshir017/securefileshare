import {
  ArrowUpRight,
  FileText,
  FolderLock,
  HardDrive,
  Link2,
  ScrollText,
  type ShieldCheck,
} from "lucide-react";

import { AuditAction } from "@/backend";
import { StatCard } from "@/components/ui/StatCard";
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
import {
  useAdminFiles,
  useAllLogs,
  useOwnerShares,
  useReceivedShares,
} from "@/hooks/useQueries";
import { formatBytes, formatDateTime, formatPrincipal } from "@/lib/format";

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

const ACTIVITY_SKELETON_KEYS = Array.from({ length: 5 }, (_, i) => i);
const UPLOADS_SKELETON_KEYS = Array.from({ length: 5 }, (_, i) => i);

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

export function AdminDashboardPage() {
  const files = useAdminFiles();
  const ownerShares = useOwnerShares();
  const receivedShares = useReceivedShares();
  const logs = useAllLogs();

  const fileList = files.data ?? [];
  const ownerList = ownerShares.data ?? [];
  const receivedList = receivedShares.data ?? [];
  const logList = logs.data ?? [];

  const storageUsed = fileList.reduce((sum, f) => sum + f.fileSize, 0n);
  const recentUploads = [...fileList]
    .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))
    .slice(0, 5);
  const recentActivities = [...logList]
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
    .slice(0, 8);

  const loading =
    files.isLoading || ownerShares.isLoading || receivedShares.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Platform-wide files, storage, shares, and recent security activity.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Files"
          value={loading ? "—" : fileList.length}
          icon={FolderLock}
          hint="Files in the vault"
          tone="primary"
          data-ocid="stat.total_files"
        />
        <StatCard
          label="Storage Used"
          value={loading ? "—" : formatBytes(storageUsed)}
          icon={HardDrive}
          hint="Encrypted bytes stored"
          tone="success"
          data-ocid="stat.storage_used"
        />
        <StatCard
          label="Files Shared"
          value={loading ? "—" : ownerList.length}
          icon={Link2}
          hint="Active shared links"
          tone="warning"
          data-ocid="stat.files_shared"
        />
        <StatCard
          label="Files Received"
          value={loading ? "—" : receivedList.length}
          icon={ArrowUpRight}
          hint="Shared with you"
          tone="destructive"
          data-ocid="stat.files_received"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="shadow-subtle">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <ScrollText className="size-4 text-primary" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs.isLoading ? (
              <div className="space-y-3" data-ocid="loading_state">
                {ACTIVITY_SKELETON_KEYS.map((k) => (
                  <Skeleton key={k} className="h-10 w-full" />
                ))}
              </div>
            ) : recentActivities.length === 0 ? (
              <EmptyState
                icon={ScrollText}
                title="No activity yet"
                description="Security events will appear here as users interact with the vault."
              />
            ) : (
              <Table data-ocid="recent_activities_table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivities.map((log, i) => (
                    <TableRow
                      key={log.id.toString()}
                      data-ocid={`activity.row.${i + 1}`}
                    >
                      <TableCell>
                        <StatusBadge tone={actionTone[log.action]} mono>
                          {actionLabel[log.action]}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatPrincipal(log.userId.toString())}
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

        <Card className="shadow-subtle">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <FileText className="size-4 text-primary" />
              Recent Uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {files.isLoading ? (
              <div className="space-y-3" data-ocid="loading_state">
                {UPLOADS_SKELETON_KEYS.map((k) => (
                  <Skeleton key={k} className="h-10 w-full" />
                ))}
              </div>
            ) : recentUploads.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No uploads yet"
                description="Files uploaded to the vault will be listed here."
              />
            ) : (
              <Table data-ocid="recent_uploads_table">
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUploads.map((file, i) => (
                    <TableRow
                      key={file.id.toString()}
                      data-ocid={`upload.row.${i + 1}`}
                    >
                      <TableCell className="max-w-[200px] truncate font-medium">
                        {file.originalFilename}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {formatBytes(file.fileSize)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(file.uploadedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-2 py-10 text-center"
      data-ocid="empty_state"
    >
      <div className="rounded-lg border border-border bg-muted/40 p-3">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <p className="font-display text-sm font-semibold">{title}</p>
      <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
