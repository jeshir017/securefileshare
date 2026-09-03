import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, ShieldOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { createActor } from "@/backend";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatPrincipal, timestampToDate } from "@/lib/format";

const SKELETON_KEYS = Array.from({ length: 4 }, (_, i) => i);

export function SharedLinksPage() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  const [revokeTarget, setRevokeTarget] = useState<{
    id: bigint;
    token: string;
  } | null>(null);

  const sharesQuery = useQuery({
    queryKey: ["ownerShares"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listOwnerShares();
    },
    enabled: !!actor && !isFetching,
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.revokeShare(id);
    },
    onSuccess: (revoked) => {
      if (revoked) {
        toast.success("Share link revoked");
        void queryClient.invalidateQueries({ queryKey: ["ownerShares"] });
        void queryClient.invalidateQueries({ queryKey: ["myActivity"] });
      } else {
        toast.error("Unable to revoke share.");
      }
      setRevokeTarget(null);
    },
    onError: () => {
      toast.error("Revoke failed. Please try again.");
      setRevokeTarget(null);
    },
  });

  const shares = sharesQuery.data ?? [];

  function isExpired(expiresAt?: bigint): boolean {
    if (expiresAt === undefined) return false;
    const date = timestampToDate(expiresAt);
    return date ? date.getTime() < Date.now() : false;
  }

  const activeShares = shares.filter(
    (s) => !s.revoked && !isExpired(s.expiresAt),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          Shared Links
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your active shared links and revoke access at any time.
        </p>
      </div>

      <Card className="shadow-subtle">
        <CardHeader>
          <CardTitle className="font-display text-base font-semibold">
            Your shared links
          </CardTitle>
          <CardDescription>
            {activeShares.length} active link
            {activeShares.length === 1 ? "" : "s"} you have created.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sharesQuery.isLoading ? (
            <div className="space-y-3" data-ocid="links.loading_state">
              {SKELETON_KEYS.map((k) => (
                <Skeleton key={k} className="h-12 w-full" />
              ))}
            </div>
          ) : shares.length === 0 ? (
            <div
              className="flex flex-col items-center gap-3 py-12 text-center"
              data-ocid="links.empty_state"
            >
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
                <Link2 className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">No shared links</p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  Links you create by sharing files will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Share token</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Permission</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shares.map((share, i) => {
                    const expired = isExpired(share.expiresAt);
                    const status = share.revoked
                      ? "revoked"
                      : expired
                        ? "expired"
                        : "active";
                    return (
                      <TableRow key={share.id.toString()}>
                        <TableCell className="max-w-[160px]">
                          <p className="truncate font-mono text-xs">
                            {share.shareToken}
                          </p>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">
                          #{share.fileId.toString()}
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">
                          {formatPrincipal(share.sharedWith.toString())}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            tone={
                              share.permission === "download"
                                ? "primary"
                                : "neutral"
                            }
                            mono
                          >
                            {share.permission.toUpperCase()}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {share.expiresAt !== undefined
                            ? formatDateTime(share.expiresAt)
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            tone={
                              status === "active"
                                ? "success"
                                : status === "expired"
                                  ? "warning"
                                  : "destructive"
                            }
                            mono
                          >
                            {status.toUpperCase()}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setRevokeTarget({
                                id: share.id,
                                token: share.shareToken,
                              })
                            }
                            disabled={share.revoked || revokeMutation.isPending}
                            className="text-destructive hover:text-destructive"
                            data-ocid={`links.revoke_button.${i}`}
                          >
                            <ShieldOff className="size-4" />
                            Revoke
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        title="Revoke share link"
        description={`This immediately revokes access for the share token "${revokeTarget?.token ?? ""}". The recipient will no longer be able to download the file.`}
        confirmLabel="Revoke link"
        destructive
        isPending={revokeMutation.isPending}
        onConfirm={() => revokeTarget && revokeMutation.mutate(revokeTarget.id)}
      />
    </div>
  );
}
