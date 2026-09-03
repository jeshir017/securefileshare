import { Toaster } from "@/components/ui/sonner";

/**
 * Global toast / notification surface. Rendered once at the app root.
 * Pages fire notifications with the `toast` API from `sonner`:
 *
 *   toast.success("File uploaded");
 *   toast.error("Upload failed");
 */
export function ToastProvider() {
  return <Toaster position="top-right" richColors closeButton />;
}
