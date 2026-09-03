import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  FolderLock,
  HardDrive,
  Link2,
  Share2,
} from "lucide-react";

import { createActor } from "@/backend";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { auditActionLabel, auditActionTone } from "@/lib/audit";
import { formatBytes, formatDateTime, formatPrincipal } from "@/lib/format";
import { useActor } from "@caffeineai/core-infrastructure";

const UPLOADS_SKELETON_KEYS = Array.from({ length: 4 }, (_, i) => i);
const ACTIVITY_SKELETON_KEYS = Array.from({ length: 4 }, (_, i) => i);

export function DashboardPage() {
  const { actor, isFetching } = useActor(createActor);

  const filesQuery = useQuery({
    queryKey: ["myFiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMyFiles();
    },
    enabled: !!actor && !isFetching,
  });

  const ownerSharesQuery = useQuery({
    queryKey: ["ownerShares"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listOwnerShares();
    },
    enabled: !!actor && !isFetching,
  });

  const receivedSharesQuery = useQuery({
    queryKey: ["receivedShares"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listSharesForUser();
    },
    enabled: !!actor && !isFetching,
  });

  const activityQuery = useQuery({
    queryKey: ["myActivity"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyActivity();
    },
    enabled: !!actor && !isFetching,
  });

  const loading =
    filesQuery.isLoading ||
    ownerSharesQuery.isLoading ||
    receivedSharesQuery.isLoading ||
    activityQuery.isLoading;

  const files = filesQuery.data ?? [];
  const ownerShares = ownerSharesQuery.data ?? [];
  const receivedShares = receivedSharesQuery.data ?? [];
  const activity = activityQuery.data ?? [];

  const totalStorage = files.reduce((sum, f) => sum + f.fileSize, 0n);
  const recentUploads = [...files]
    .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))
    .slice(0, 5);
  const recentActivity = [...activity]
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of your files, shares, and recent security activity.
          </p>
        </div>
        <Button asChild data-ocid="dashboard.upload_button">
          <Link to="/upload">
            <ArrowUpRight className="size-4" />
            Upload file
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total files"
          value={files.length}
          icon={FolderLock}
          hint="Files in your vault"
          tone="primary"
        />
        <StatCard
          label="Storage used"
          value={formatBytes(totalStorage)}
          icon={HardDrive}
          hint="Encrypted at rest"
          tone="success"
        />
        <StatCard
          label="Files shared"
          value={ownerShares.length}
          icon={Share2}
          hint="Active shared links"
          tone="warning"
        />
        <StatCard
          label="Files received"
          value={receivedShares.length}
          icon={Link2}
          hint="Shared with you"
          tone="primary"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-subtle">
          <CardHeader>
            <CardTitle className="font-display text-base font-semibold">
              Recent uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3" data-ocid="dashboard.loading_state">
                {UPLOADS_SKELETON_KEYS.map((k) => (
                  <Skeleton key={k} className="h-12 w-full" />
                ))}
              </div>
            ) : recentUploads.length === 0 ? (
              <EmptyState
                title="No files yet"
                description="Upload your first encrypted file to get started."
                actionLabel="Upload a file"
                actionTo="/upload"
              />
            ) : (
              <ul
                className="divide-y divide-border"
                data-ocid="dashboard.upload_list"
              >
                {recentUploads.map((file, i) => (
                  <li
                    key={file.id.toString()}
                    className="flex items-center justify-between gap-3 py-3"
                    data-ocid={`dashboard.upload_item.${i}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {file.originalFilename}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {formatBytes(file.fileSize)} ·{" "}
                        {formatDateTime(file.uploadedAt)}
                      </p>
                    </div>
                    <StatusBadge tone="success" mono>
                      ENCRYPTED
                    </StatusBadge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-subtle">
          <CardHeader>
            <CardTitle className="font-display text-base font-semibold">
              Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3" data-ocid="dashboard.loading_state">
                {ACTIVITY_SKELETON_KEYS.map((k) => (
                  <Skeleton key={k} className="h-12 w-full" />
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <EmptyState
                title="No activity yet"
                description="Security events will appear here as you use the vault."
                actionLabel="View activity logs"
                actionTo="/activity"
              />
            ) : (
              <ul
                className="divide-y divide-border"
                data-ocid="dashboard.activity_list"
              >
                {recentActivity.map((log, i) => (
                  <li
                    key={log.id.toString()}
                    className="flex items-center justify-between gap-3 py-3"
                    data-ocid={`dashboard.activity_item.${i}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {auditActionLabel(log.action)}
                      </p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {formatDateTime(log.timestamp)} ·{" "}
                        {formatPrincipal(log.ipAddress)}
                      </p>
                    </div>
                    <StatusBadge tone={auditActionTone(log.action)} mono>
                      {log.action.toUpperCase()}
                    </StatusBadge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
}: {
  title: string;
  description: string;
  actionLabel: string;
  actionTo: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-3 py-8 text-center"
      data-ocid="dashboard.empty_state"
    >
      <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
        <Activity className="size-5 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          {description}
        </p>
      </div>
      <Button
        asChild
        variant="outline"
        size="sm"
        data-ocid="dashboard.empty_action"
      >
        <Link to={actionTo}>{actionLabel}</Link>
      </Button>
    </div>
  );
}
