import { useActor } from "@caffeineai/core-infrastructure";
import { ExternalBlob } from "@caffeineai/object-storage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileUp, Lock, ShieldCheck, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { createActor } from "@/backend";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/format";
import { prepareUpload, storeKey } from "@/lib/vault";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/json",
  "application/zip",
  "application/x-zip-compressed",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export function UploadPage() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<"idle" | "encrypting" | "uploading">(
    "idle",
  );

  const uploadMutation = useMutation({
    mutationFn: async (selected: File) => {
      if (!actor) throw new Error("Backend is not ready");

      setStage("encrypting");
      setProgress(5);
      const prepared = await prepareUpload(selected);

      setStage("uploading");
      const blob = ExternalBlob.fromBytes(
        prepared.ciphertext,
        selected.type,
        selected.name,
      ).withUploadProgress((pct) => {
        // Map the gateway progress (0-100) into the overall bar.
        setProgress(Math.round(5 + pct * 0.9));
      });

      const view = await actor.uploadFile(
        selected.name,
        selected.name,
        selected.type,
        BigInt(prepared.ciphertext.byteLength),
        prepared.sha256,
        blob,
      );

      // Retain the key/iv in this session, keyed by the backend file id.
      storeKey(view.id.toString(), { key: prepared.key, iv: prepared.iv });
      setProgress(100);
      return view;
    },
    onSuccess: (view) => {
      toast.success(`"${view.originalFilename}" encrypted and uploaded`);
      void queryClient.invalidateQueries({ queryKey: ["myFiles"] });
      void queryClient.invalidateQueries({ queryKey: ["myActivity"] });
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Upload failed. Please try again.");
      setStage("idle");
      setProgress(0);
    },
  });

  function resetForm() {
    setFile(null);
    setError(null);
    setProgress(0);
    setStage("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleSelect(next: File | undefined) {
    setError(null);
    if (!next) return;

    if (next.size > MAX_FILE_SIZE) {
      setError(
        `File is ${formatBytes(next.size)}. Maximum allowed size is ${formatBytes(MAX_FILE_SIZE)}.`,
      );
      setFile(null);
      return;
    }
    if (next.type && !ALLOWED_TYPES.includes(next.type)) {
      setError(`File type "${next.type || "unknown"}" is not allowed.`);
      setFile(null);
      return;
    }
    setFile(next);
  }

  const isBusy = uploadMutation.isPending || stage !== "idle";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          Upload File
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Encrypt a file in your browser before storing it in the vault.
        </p>
      </div>

      <Card className="shadow-subtle">
        <CardHeader>
          <CardTitle className="font-display text-base font-semibold">
            New encrypted upload
          </CardTitle>
          <CardDescription>
            Files are encrypted with AES-256-GCM and hashed with SHA-256 before
            they leave your browser. The encryption key never reaches the
            server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div
            className="grid-motif scanline relative flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center"
            data-ocid="upload.dropzone"
          >
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
              <FileUp className="size-6 text-primary" />
            </div>
            {file ? (
              <div className="flex w-full max-w-md items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {formatBytes(file.size)} · {file.type || "unknown type"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove selected file"
                  onClick={resetForm}
                  disabled={isBusy}
                  data-ocid="upload.remove_button"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium">Drag and drop a file, or</p>
                <Button
                  variant="outline"
                  onClick={() => inputRef.current?.click()}
                  disabled={isBusy}
                  data-ocid="upload.select_button"
                >
                  Choose file
                </Button>
                <p className="text-xs text-muted-foreground">
                  Max {formatBytes(MAX_FILE_SIZE)} · PDF, text, images, archives
                </p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              onChange={(e) => handleSelect(e.target.files?.[0])}
              disabled={isBusy}
              data-ocid="upload.input"
            />
          </div>

          {error ? (
            <p
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              data-ocid="upload.error_state"
            >
              {error}
            </p>
          ) : null}

          {isBusy ? (
            <div className="space-y-2" data-ocid="upload.progress">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono tracking-widest text-muted-foreground uppercase">
                  {stage === "encrypting" ? "Encrypting…" : "Uploading…"}
                </span>
                <span className="font-mono text-muted-foreground">
                  {progress}%
                </span>
              </div>
              <Progress value={progress} />
            </div>
          ) : null}

          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
            <Lock className="size-4 shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground">
              AES-256-GCM encryption and SHA-256 integrity hashing happen
              locally. Your key is never transmitted or stored on the server.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={resetForm}
              disabled={isBusy || !file}
              data-ocid="upload.cancel_button"
            >
              Clear
            </Button>
            <Button
              onClick={() => file && uploadMutation.mutate(file)}
              disabled={!file || isBusy || !!error}
              data-ocid="upload.submit_button"
            >
              <ShieldCheck className="size-4" />
              {stage === "encrypting"
                ? "Encrypting…"
                : stage === "uploading"
                  ? "Uploading…"
                  : "Encrypt & upload"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
