import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type MockActor, createMockActor, sampleFile } from "./mocks";

const { storeKeyMock, prepareUploadMock } = vi.hoisted(() => ({
  storeKeyMock: vi.fn(),
  prepareUploadMock: vi.fn(),
}));

let mockActor: MockActor;

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: mockActor, isFetching: false }),
}));

vi.mock("@/lib/vault", () => ({
  prepareUpload: prepareUploadMock,
  storeKey: storeKeyMock,
}));

vi.mock("@caffeineai/object-storage", () => ({
  ExternalBlob: class ExternalBlob {
    static fromBytes(bytes: Uint8Array, _type: string, _name: string) {
      return new ExternalBlob(bytes);
    }
    constructor(private bytes: Uint8Array) {}
    withUploadProgress() {
      return this;
    }
  },
}));

import { UploadPage } from "@/pages/UploadPage";

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <UploadPage />
    </QueryClientProvider>,
  );
}

describe("UploadPage", () => {
  beforeEach(() => {
    mockActor = createMockActor();
    storeKeyMock.mockReset();
    prepareUploadMock.mockReset();
    prepareUploadMock.mockResolvedValue({
      ciphertext: new Uint8Array([1, 2, 3]),
      sha256: "abc123",
      key: { type: "secret" },
      iv: new Uint8Array(12),
    });
  });

  it("rejects a disallowed file type before upload", async () => {
    const user = userEvent.setup();
    renderPage();

    const input = screen.getByTestId("upload.input");
    const file = new File(["x"], "evil.exe", {
      type: "application/x-msdownload",
    });
    await user.upload(input, file);

    expect(await screen.findByTestId("upload.error_state")).toHaveTextContent(
      /file type/i,
    );
    expect(screen.getByTestId("upload.submit_button")).toBeDisabled();
    expect(mockActor.uploadFile).not.toHaveBeenCalled();
  });

  it("uploads a selected file, calling uploadFile and storing the key", async () => {
    const user = userEvent.setup();
    mockActor.uploadFile.mockResolvedValue(sampleFile);
    renderPage();

    const input = screen.getByTestId("upload.input");
    const file = new File(["hello"], "report.txt", { type: "text/plain" });
    await user.upload(input, file);

    expect(screen.getByText("report.txt")).toBeInTheDocument();

    const submit = screen.getByTestId("upload.submit_button");
    expect(submit).toBeEnabled();
    await user.click(submit);

    await waitFor(() => expect(prepareUploadMock).toHaveBeenCalled());

    await waitFor(() =>
      expect(mockActor.uploadFile).toHaveBeenCalledWith(
        "report.txt",
        "report.txt",
        "text/plain",
        3n,
        "abc123",
        expect.anything(),
      ),
    );
    // The key is retained in the session keyed by the backend file id.
    await waitFor(() =>
      expect(storeKeyMock).toHaveBeenCalledWith(
        "1",
        expect.objectContaining({
          key: expect.anything(),
          iv: expect.anything(),
        }),
      ),
    );
  });
});
