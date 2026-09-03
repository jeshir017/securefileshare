import { useActor } from "@caffeineai/core-infrastructure";
import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Link2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SharePermission, createActor } from "@/backend";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportKey } from "@/lib/crypto";
import { formatBytes } from "@/lib/format";
import { getKey } from "@/lib/vault";

export function ShareFilePage() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();

  const [fileId, setFileId] = useState<string>("");
  const [recipient, setRecipient] = useState("");
  const [permission, setPermission] = useState<SharePermission>(
    SharePermission.download,
  );
  const [expiresAt, setExpiresAt] = useState("");
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const filesQuery = useQuery({
    queryKey: ["myFiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMyFiles();
    },
    enabled: !!actor && !isFetching,
  });

  const shareMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      const parsedFileId = BigInt(fileId);
      const recipientPrincipal = Principal.fromText(recipient.trim());
      const expires: bigint | null = expiresAt
        ? BigInt(new Date(expiresAt).getTime()) * 1_000_000n
        : null;
      const stored = getKey(parsedFileId.toString());
      if (!stored) {
        throw new Error(
          "Encryption key is not available in this session. Re-upload the file to share it.",
        );
      }
      const key = await exportKey(stored.key);
      const decryptionKey = JSON.stringify({
        key,
        iv: Array.from(stored.iv),
      });
      return actor.createShare(
        parsedFileId,
        recipientPrincipal,
        permission,
        expires,
        decryptionKey,
      );
    },
    onSuccess: (view) => {
      setGeneratedToken(view.shareToken);
      toast.success("Share link created");
      void queryClient.invalidateQueries({ queryKey: ["ownerShares"] });
      void queryClient.invalidateQueries({ queryKey: ["myActivity"] });
    },
    onError: (err: Error) => {
      toast.error(
        err.message || "Unable to create share. Check the recipient principal.",
      );
    },
  });

  const files = filesQuery.data ?? [];
  const selectedFile = files.find((f) => f.id.toString() === fileId);

  const canSubmit =
    !!fileId && recipient.trim().length > 0 && !shareMutation.isPending;

  function copyToken() {
    if (!generatedToken) return;
    void navigator.clipboard.writeText(generatedToken);
    toast.success("Share token copied");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          Share File
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share a file with another user and set permissions and expiry.
        </p>
      </div>

      <Card className="shadow-subtle">
        <CardHeader>
          <CardTitle className="font-display text-base font-semibold">
            New secure share
          </CardTitle>
          <CardDescription>
            Generate a secure share token for one of your encrypted files.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="share-file">File</Label>
            <Select value={fileId} onValueChange={setFileId}>
              <SelectTrigger className="w-full" data-ocid="share.file_select">
                <SelectValue placeholder="Select a file to share" />
              </SelectTrigger>
              <SelectContent>
                {files.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    No files available
                  </SelectItem>
                ) : (
                  files.map((f) => (
                    <SelectItem key={f.id.toString()} value={f.id.toString()}>
                      {f.originalFilename} · {formatBytes(f.fileSize)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedFile ? (
              <p className="font-mono text-xs text-muted-foreground">
                {selectedFile.originalFilename} ·{" "}
                {formatBytes(selectedFile.fileSize)}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="share-recipient">Recipient principal</Label>
            <Input
              id="share-recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter the recipient's principal ID"
              className="font-mono"
              data-ocid="share.recipient_input"
            />
            <p className="text-xs text-muted-foreground">
              Paste the principal ID of the registered user you want to share
              with.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="share-permission">Permission</Label>
              <Select
                value={permission}
                onValueChange={(v) => setPermission(v as SharePermission)}
              >
                <SelectTrigger
                  className="w-full"
                  data-ocid="share.permission_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SharePermission.view}>
                    View only
                  </SelectItem>
                  <SelectItem value={SharePermission.download}>
                    View & download
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="share-expiry">Expiration</Label>
              <Input
                id="share-expiry"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                data-ocid="share.expiry_input"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for no expiration.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => shareMutation.mutate()}
              disabled={!canSubmit}
              data-ocid="share.submit_button"
            >
              <ShieldCheck className="size-4" />
              {shareMutation.isPending ? "Creating…" : "Generate share link"}
            </Button>
          </div>

          {generatedToken ? (
            <div
              className="rounded-lg border border-primary/30 bg-primary/10 p-4"
              data-ocid="share.success_state"
            >
              <div className="flex items-center gap-2">
                <Link2 className="size-4 text-primary" />
                <p className="text-sm font-medium">
                  Secure share token generated
                </p>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-card px-3 py-2 font-mono text-xs">
                  {generatedToken}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToken}
                  data-ocid="share.copy_button"
                >
                  <Copy className="size-4" />
                  Copy
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Share this token with the recipient. Access is enforced by the
                backend on every download.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
