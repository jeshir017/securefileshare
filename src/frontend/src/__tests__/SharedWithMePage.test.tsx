import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type MockActor, createMockActor, sampleShare } from "./mocks";

let mockActor: MockActor;

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: mockActor, isFetching: false }),
}));

vi.mock("@/lib/crypto", () => ({
  importKey: vi.fn(),
  decryptFile: vi.fn(),
  sha256Hex: vi.fn().mockResolvedValue("abc123"),
}));

vi.mock("@/lib/vault", () => ({
  triggerDownload: vi.fn(),
}));

import { decryptFile, importKey, sha256Hex } from "@/lib/crypto";
import { triggerDownload } from "@/lib/vault";
import { SharedWithMePage } from "@/pages/SharedWithMePage";

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SharedWithMePage />
    </QueryClientProvider>,
  );
}

describe("SharedWithMePage", () => {
  beforeEach(() => {
    mockActor = createMockActor();
  });

  it("shows an empty state when there are no shares", async () => {
    renderPage();
    expect(await screen.findByTestId("shared.empty_state")).toBeInTheDocument();
    expect(screen.getByText(/no shares yet/i)).toBeInTheDocument();
  });

  it("lists an active share and enables download", async () => {
    mockActor.listSharesForUser.mockResolvedValue([sampleShare]);
    renderPage();

    expect(await screen.findByText(/file #1/i)).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    const download = screen.getByTestId("shared.download_button.0");
    expect(download).toBeEnabled();
  });

  it("disables download for a revoked share", async () => {
    mockActor.listSharesForUser.mockResolvedValue([
      { ...sampleShare, revoked: true },
    ]);
    renderPage();

    expect(await screen.findByText("REVOKED")).toBeInTheDocument();
    expect(screen.getByTestId("shared.download_button.0")).toBeDisabled();
  });

  it("disables download for an expired share", async () => {
    mockActor.listSharesForUser.mockResolvedValue([
      { ...sampleShare, expiresAt: 1_000_000_000_000_000n },
    ]);
    renderPage();

    expect(await screen.findByText("EXPIRED")).toBeInTheDocument();
    expect(screen.getByTestId("shared.download_button.0")).toBeDisabled();
  });

  it("checks download access before downloading", async () => {
    mockActor.listSharesForUser.mockResolvedValue([sampleShare]);
    mockActor.checkDownloadAccess.mockResolvedValue(true);
    mockActor.downloadFile.mockResolvedValue({
      blob: { getBytes: async () => new Uint8Array([1, 2, 3]) },
      decryptionKey: undefined,
    });
    renderPage();

    const download = await screen.findByTestId("shared.download_button.0");
    await userEvent.click(download);

    await waitFor(() =>
      expect(mockActor.checkDownloadAccess).toHaveBeenCalledWith(1n),
    );
    await waitFor(() =>
      expect(mockActor.downloadFile).toHaveBeenCalledWith(1n),
    );
  });

  it("decrypts and verifies integrity on a shared download", async () => {
    vi.mocked(importKey).mockResolvedValue({ type: "secret" } as CryptoKey);
    vi.mocked(decryptFile).mockResolvedValue(
      new TextEncoder().encode("plaintext").buffer,
    );
    vi.mocked(sha256Hex).mockResolvedValue("abc123");
    vi.mocked(triggerDownload).mockClear();

    mockActor.listSharesForUser.mockResolvedValue([sampleShare]);
    mockActor.checkDownloadAccess.mockResolvedValue(true);
    mockActor.downloadFile.mockResolvedValue({
      blob: { getBytes: async () => new Uint8Array([1, 2, 3]) },
      decryptionKey: JSON.stringify({
        key: { kty: "oct", alg: "A256GCM" },
        iv: [1, 2, 3],
      }),
      sha256Hash: "abc123",
    });
    renderPage();

    const download = await screen.findByTestId("shared.download_button.0");
    await userEvent.click(download);

    await waitFor(() => expect(importKey).toHaveBeenCalled());
    await waitFor(() => expect(decryptFile).toHaveBeenCalled());
    await waitFor(() => expect(sha256Hex).toHaveBeenCalled());
    await waitFor(() => expect(triggerDownload).toHaveBeenCalled());
  });
});
