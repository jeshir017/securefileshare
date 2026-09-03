import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type MockActor,
  createMockActor,
  regularUser,
  sampleFile,
  sampleLog,
  sampleShare,
} from "./mocks";

let mockActor: MockActor;

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: mockActor, isFetching: false }),
}));

import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { FailedLoginPage } from "@/pages/admin/FailedLoginPage";
import { SecurityLogsPage } from "@/pages/admin/SecurityLogsPage";
import { UserManagementPage } from "@/pages/admin/UserManagementPage";

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    mockActor = createMockActor();
  });

  it("shows platform stats and recent activity", async () => {
    mockActor.listAllFiles.mockResolvedValue([sampleFile]);
    mockActor.listOwnerShares.mockResolvedValue([sampleShare]);
    mockActor.listSharesForUser.mockResolvedValue([sampleShare]);
    mockActor.getAllLogs.mockResolvedValue([sampleLog]);

    renderWithQuery(<AdminDashboardPage />);

    expect(await screen.findByText("Total Files")).toBeInTheDocument();
    // Total Files, Files Shared, and Files Received each render "1".
    expect(await screen.findAllByText("1")).toHaveLength(3);
    // "1.0 KB" appears in the Storage Used stat and the Recent Uploads table.
    expect((await screen.findAllByText("1.0 KB")).length).toBeGreaterThan(0);
    expect(await screen.findByText("Login")).toBeInTheDocument();
  });
});

describe("UserManagementPage", () => {
  beforeEach(() => {
    mockActor = createMockActor();
  });

  it("lists registered users with status", async () => {
    mockActor.listAllUsers.mockResolvedValue([regularUser]);
    renderWithQuery(<UserManagementPage />);

    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("deactivates a user after confirmation", async () => {
    mockActor.listAllUsers.mockResolvedValue([regularUser]);
    mockActor.setAccountStatus.mockResolvedValue({ __kind__: "ok", ok: null });
    renderWithQuery(<UserManagementPage />);

    await userEvent.click(await screen.findByTestId("deactivate_button.1"));
    expect(
      await screen.findByRole("heading", { name: /deactivate account/i }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("confirm_button"));

    await waitFor(() =>
      expect(mockActor.setAccountStatus).toHaveBeenCalledWith(
        regularUser.principal,
        "deactivated",
      ),
    );
  });
});

describe("SecurityLogsPage", () => {
  beforeEach(() => {
    mockActor = createMockActor();
  });

  it("shows the audit trail", async () => {
    mockActor.getAllLogs.mockResolvedValue([sampleLog]);
    renderWithQuery(<SecurityLogsPage />);

    expect(await screen.findByText("Login")).toBeInTheDocument();
    expect(screen.getByText("1 events")).toBeInTheDocument();
  });
});

describe("FailedLoginPage", () => {
  beforeEach(() => {
    mockActor = createMockActor();
  });

  it("shows failed login attempts", async () => {
    mockActor.listFailedLogins.mockResolvedValue([
      {
        email: "attacker@example.com",
        attemptedAt: 1_700_000_000_000_000_000n,
      },
    ]);
    renderWithQuery(<FailedLoginPage />);

    expect(await screen.findByText("attacker@example.com")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });
});
