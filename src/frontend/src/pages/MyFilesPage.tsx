import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FolderLock, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBytes, formatDate, truncateHash } from "@/lib/format";
import { decryptAndVerify, getKey, triggerDownload } from "@/lib/vault";

type TypeFilter = "all" | "image" | "document" | "archive" | "other";

const SKELETON_KEYS = Array.from({ length: 5 }, (_, i) => i);

function fileCategory(mimeType: string): TypeFilter {
  if (mimeType.startsWith("image/")) return "image";
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("text") ||
    mimeType.includes("json") ||
    mimeType.includes("word") ||
    mimeType.includes("excel") ||
    mimeType.includes("sheet")
  )
    return "document";
  if (mimeType.includes("zip") || mimeType.includes("compressed"))
    return "archive";
  return "other";
}

export function MyFilesPage() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: bigint;
    name: string;
  } | null>(null);

  const filesQuery = useQuery({
    queryKey: ["myFiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMyFiles();
    },
    enabled: !!actor && !isFetching,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteFile(id);
    },
    onSuccess: (deleted, _id) => {
      if (deleted) {
        toast.success("File deleted");
        void queryClient.invalidateQueries({ queryKey: ["myFiles"] });
        void queryClient.invalidateQueries({ queryKey: ["myActivity"] });
      } else {
        toast.error("Unable to delete file.");
      }
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error("Delete failed. Please try again.");
      setDeleteTarget(null);
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (file: { id: bigint; name: string; hash: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.downloadFile(file.id);
      if (!result) throw new Error("File not found or access denied.");
      const bytes = await result.blob.getBytes();
      if (getKey(file.id.toString())) {
        const plaintext = await decryptAndVerify(
          file.id.toString(),
          bytes,
          file.hash,
        );
        triggerDownload(plaintext, file.name);
      } else {
        triggerDownload(bytes, file.name);
      }
      return file.name;
    },
    onSuccess: (name) => {
      toast.success(`"${name}" downloaded`);
      void queryClient.invalidateQueries({ queryKey: ["myActivity"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Download failed.");
    },
  });

  const files = filesQuery.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return files.filter((f) => {
      const matchesSearch =
        !q ||
        f.originalFilename.toLowerCase().includes(q) ||
        f.mimeType.toLowerCase().includes(q);
      const matchesType =
        typeFilter === "all" || fileCategory(f.mimeType) === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [files, search, typeFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          My Files
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search, filter, download, and delete your encrypted files.
        </p>
      </div>

      <Card className="shadow-subtle">
        <CardHeader>
          <CardTitle className="font-display text-base font-semibold">
            Encrypted vault
          </CardTitle>
          <CardDescription>
            {files.length} file{files.length === 1 ? "" : "s"} stored with
            AES-256-GCM encryption and SHA-256 integrity verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by filename or type…"
                className="pl-9"
                data-ocid="files.search_input"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as TypeFilter)}
            >
              <SelectTrigger
                className="w-full sm:w-44"
                data-ocid="files.type_filter"
              >
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="archive">Archives</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filesQuery.isLoading ? (
            <div className="space-y-3" data-ocid="files.loading_state">
              {SKELETON_KEYS.map((k) => (
                <Skeleton key={k} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center gap-3 py-12 text-center"
              data-ocid="files.empty_state"
            >
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
                <FolderLock className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {files.length === 0 ? "No files yet" : "No matching files"}
                </p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  {files.length === 0
                    ? "Upload your first encrypted file to see it here."
                    : "Try adjusting your search or type filter."}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Integrity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((file, i) => (
                    <TableRow key={file.id.toString()}>
                      <TableCell className="max-w-[220px]">
                        <p className="truncate font-medium">
                          {file.originalFilename}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {truncateHash(file.sha256Hash)}
                        </p>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {formatBytes(file.fileSize)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone="neutral" mono>
                          {file.mimeType || "unknown"}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(file.uploadedAt)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone="success" mono>
                          VERIFIED
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Download ${file.originalFilename}`}
                            onClick={() =>
                              downloadMutation.mutate({
                                id: file.id,
                                name: file.originalFilename,
                                hash: file.sha256Hash,
                              })
                            }
                            disabled={downloadMutation.isPending}
                            data-ocid={`files.download_button.${i}`}
                          >
                            <Download className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${file.originalFilename}`}
                            onClick={() =>
                              setDeleteTarget({
                                id: file.id,
                                name: file.originalFilename,
                              })
                            }
                            disabled={deleteMutation.isPending}
                            className="text-destructive hover:text-destructive"
                            data-ocid={`files.delete_button.${i}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete file"
        description={`This permanently deletes "${deleteTarget?.name ?? ""}" and revokes any shares of it. This action cannot be undone.`}
        confirmLabel="Delete file"
        destructive
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  );
}
