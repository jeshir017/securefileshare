import { Link2 } from "lucide-react";

import { SharePermission } from "@/backend";
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
import { useAllShares } from "@/hooks/useQueries";
import { formatDateTime, formatPrincipal, truncateHash } from "@/lib/format";

const SKELETON_KEYS = ["skeleton-1", "skeleton-2", "skeleton-3", "skeleton-4"];

export function ShareManagementPage() {
  const allShares = useAllShares();

  const list = allShares.data ?? [];
  const loading = allShares.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          Share Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Review every share across all users, including owners, recipients,
          permissions, and revocation status.
        </p>
      </div>

      <Card className="shadow-subtle">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Link2 className="size-4 text-primary" />
            All Shares
            <span className="ml-auto font-mono text-xs font-normal text-muted-foreground">
              {list.length} total
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3" data-ocid="loading_state">
              {SKELETON_KEYS.map((key) => (
                <Skeleton key={key} className="h-12 w-full" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <EmptyState
              icon={Link2}
              title="No shares"
              description="Shares created across all users will be listed here."
            />
          ) : (
            <Table data-ocid="all_shares_table">
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Shared With</TableHead>
                  <TableHead>Permission</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((share, i) => (
                  <TableRow
                    key={share.id.toString()}
                    data-ocid={`share.row.${i + 1}`}
                  >
                    <TableCell className="font-mono text-xs text-primary">
                      {truncateHash(share.shareToken)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatPrincipal(share.owner.toString())}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatPrincipal(share.sharedWith.toString())}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone="primary" mono>
                        {share.permission === SharePermission.download
                          ? "Download"
                          : "View"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {share.expiresAt
                        ? formatDateTime(share.expiresAt)
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        tone={share.revoked ? "destructive" : "success"}
                        pulse={!share.revoked}
                      >
                        {share.revoked ? "Revoked" : "Active"}
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

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Link2;
  title: string;
  description: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-2 py-12 text-center"
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
