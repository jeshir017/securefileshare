import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type MockActor, createMockActor, sampleFile } from "./mocks";

let mockActor: MockActor;

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: mockActor, isFetching: false }),
}));

vi.mock("@/lib/vault", () => ({
  getKey: vi.fn().mockReturnValue(undefined),
  decryptAndVerify: vi.fn(),
  triggerDownload: vi.fn(),
}));

import { MyFilesPage } from "@/pages/MyFilesPage";

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MyFilesPage />
    </QueryClientProvider>,
  );
}

describe("MyFilesPage", () => {
  beforeEach(() => {
    mockActor = createMockActor();
  });

  it("shows an empty state when there are no files", async () => {
    renderPage();
    expect(await screen.findByTestId("files.empty_state")).toBeInTheDocument();
    expect(screen.getByText(/no files yet/i)).toBeInTheDocument();
  });

  it("lists the user's files with integrity status", async () => {
    mockActor.listMyFiles.mockResolvedValue([sampleFile]);
    renderPage();

    expect(await screen.findByText("report.txt")).toBeInTheDocument();
    expect(screen.getByText("VERIFIED")).toBeInTheDocument();
    expect(screen.getByText("1.0 KB")).toBeInTheDocument();
  });

  it("downloads a file and triggers a browser download", async () => {
    mockActor.listMyFiles.mockResolvedValue([sampleFile]);
    mockActor.downloadFile.mockResolvedValue({
      blob: { getBytes: async () => new Uint8Array([1, 2, 3]) },
      decryptionKey: undefined,
    });
    renderPage();

    const download = await screen.findByRole("button", {
      name: /download report\.txt/i,
    });
    await userEvent.click(download);

    await waitFor(() =>
      expect(mockActor.downloadFile).toHaveBeenCalledWith(1n),
    );
  });

  it("deletes a file after confirmation", async () => {
    mockActor.listMyFiles.mockResolvedValue([sampleFile]);
    mockActor.deleteFile.mockResolvedValue(true);
    renderPage();

    const del = await screen.findByRole("button", {
      name: /delete report\.txt/i,
    });
    await userEvent.click(del);

    // Confirm dialog appears.
    expect(
      await screen.findByRole("heading", { name: /delete file/i }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("confirm_button"));

    await waitFor(() => expect(mockActor.deleteFile).toHaveBeenCalledWith(1n));
  });
});
