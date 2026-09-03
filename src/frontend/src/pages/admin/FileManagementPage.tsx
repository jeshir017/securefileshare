import { FileText, FolderLock } from "lucide-react";

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
import { useAdminFiles } from "@/hooks/useQueries";
import { formatBytes, formatDateTime, truncateHash } from "@/lib/format";

const SKELETON_KEYS = Array.from({ length: 6 }, (_, i) => i);

export function FileManagementPage() {
  const files = useAdminFiles();
  const fileList = files.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          File Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Review files stored in the vault, including integrity hashes and
          storage metadata.
        </p>
      </div>

      <Card className="shadow-subtle">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <FolderLock className="size-4 text-primary" />
            All Files
            <span className="ml-auto font-mono text-xs font-normal text-muted-foreground">
              {fileList.length} total
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {files.isLoading ? (
            <div className="space-y-3" data-ocid="loading_state">
              {SKELETON_KEYS.map((k) => (
                <Skeleton key={k} className="h-12 w-full" />
              ))}
            </div>
          ) : fileList.length === 0 ? (
            <div
              className="flex flex-col items-center gap-2 py-12 text-center"
              data-ocid="empty_state"
            >
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <FileText className="size-5 text-muted-foreground" />
              </div>
              <p className="font-display text-sm font-semibold">
                No files found
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Files uploaded to the vault will appear here with their
                integrity hashes.
              </p>
            </div>
          ) : (
            <Table data-ocid="files_table">
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>SHA-256</TableHead>
                  <TableHead>Uploaded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fileList.map((file, i) => (
                  <TableRow
                    key={file.id.toString()}
                    data-ocid={`file.row.${i + 1}`}
                  >
                    <TableCell className="max-w-[220px] truncate font-medium">
                      {file.originalFilename}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {file.mimeType}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatBytes(file.fileSize)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-primary">
                      {truncateHash(file.sha256Hash)}
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
  );
}
