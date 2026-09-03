import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Share2 } from "lucide-react";
import { toast } from "sonner";

import { createActor } from "@/backend";
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
import { decryptFile, importKey, sha256Hex } from "@/lib/crypto";
import { formatDateTime, formatPrincipal, timestampToDate } from "@/lib/format";
import { triggerDownload } from "@/lib/vault";

const SKELETON_KEYS = Array.from({ length: 4 }, (_, i) => i);

export function SharedWithMePage() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();

  const sharesQuery = useQuery({
    queryKey: ["receivedShares"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listSharesForUser();
    },
    enabled: !!actor && !isFetching,
  });

  const downloadMutation = useMutation({
    mutationFn: async (share: {
      shareId: bigint;
      fileId: bigint;
      filename: string;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      const allowed = await actor.checkDownloadAccess(share.shareId);
      if (!allowed) {
        throw new Error(
          "Access denied. This share is revoked, expired, or not permitted.",
        );
      }
      const result = await actor.downloadFile(share.fileId);
      if (!result) throw new Error("File not found or access denied.");
      const bytes = await result.blob.getBytes();
      if (result.decryptionKey) {
        // The backend returns the file's AES-256 data key (JWK + IV) so the
        // recipient can decrypt the ciphertext in the browser.
        const { key, iv } = JSON.parse(result.decryptionKey) as {
          key: JsonWebKey;
          iv: number[];
        };
        const cryptoKey = await importKey(key);
        const plaintext = await decryptFile(
          new Uint8Array(bytes).buffer,
          new Uint8Array(iv),
          cryptoKey,
        );
        const plainBytes = new Uint8Array(plaintext);
        // Verify the decrypted bytes against the file's stored SHA-256
        // integrity hash so tampering is detected on shared downloads.
        const hash = await sha256Hex(plainBytes);
        if (hash !== result.sha256Hash) {
          throw new Error(
            "Integrity check failed: the shared file's hash does not match. The file may have been tampered with.",
          );
        }
        triggerDownload(plainBytes, share.filename);
      } else {
        triggerDownload(bytes, share.filename);
      }
      return share.filename;
    },
    onSuccess: (name) => {
      toast.success(`"${name}" downloaded`);
      void queryClient.invalidateQueries({ queryKey: ["myActivity"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Download failed.");
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
          Shared With Me
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Files other users have shared with you, with access controls.
        </p>
      </div>

      <Card className="shadow-subtle">
        <CardHeader>
          <CardTitle className="font-display text-base font-semibold">
            Incoming shares
          </CardTitle>
          <CardDescription>
            {activeShares.length} active share
            {activeShares.length === 1 ? "" : "s"} available to you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sharesQuery.isLoading ? (
            <div className="space-y-3" data-ocid="shared.loading_state">
              {SKELETON_KEYS.map((k) => (
                <Skeleton key={k} className="h-12 w-full" />
              ))}
            </div>
          ) : shares.length === 0 ? (
            <div
              className="flex flex-col items-center gap-3 py-12 text-center"
              data-ocid="shared.empty_state"
            >
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
                <Share2 className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">No shares yet</p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  Files shared with you by other users will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Owner</TableHead>
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
                    const canDownload =
                      status === "active" && share.permission === "download";
                    return (
                      <TableRow key={share.id.toString()}>
                        <TableCell className="max-w-[200px]">
                          <p className="truncate font-medium">
                            File #{share.fileId.toString()}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {share.shareToken.slice(0, 12)}…
                          </p>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">
                          {formatPrincipal(share.owner.toString())}
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
                              downloadMutation.mutate({
                                shareId: share.id,
                                fileId: share.fileId,
                                filename: `shared-file-${share.fileId.toString()}`,
                              })
                            }
                            disabled={
                              !canDownload || downloadMutation.isPending
                            }
                            data-ocid={`shared.download_button.${i}`}
                          >
                            <Download className="size-4" />
                            Download
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
    </div>
  );
}
