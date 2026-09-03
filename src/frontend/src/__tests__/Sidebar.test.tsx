import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockAuth, regularUser } from "./mocks";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...rest
  }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useLocation: () => ({ pathname: "/dashboard" }),
}));

import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";

const mockedUseAuth = vi.mocked(useAuth);

describe("Sidebar", () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue(
      createMockAuth({
        isAdmin: false,
        user: regularUser,
        logoutApp: vi.fn(),
        logoutPending: false,
      }),
    );
  });

  it("hides admin navigation for a standard user", () => {
    render(<Sidebar />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Admin Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("User Management")).not.toBeInTheDocument();
    expect(screen.getByText("Standard user")).toBeInTheDocument();
  });

  it("shows admin navigation for an admin", () => {
    mockedUseAuth.mockReturnValue(
      createMockAuth({
        isAdmin: true,
        user: regularUser,
        logoutApp: vi.fn(),
        logoutPending: false,
      }),
    );
    render(<Sidebar />);
    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    expect(screen.getByText("User Management")).toBeInTheDocument();
    expect(screen.getByText("Security Logs")).toBeInTheDocument();
    expect(screen.getByText("Failed Logins")).toBeInTheDocument();
    expect(screen.getByText("Administrator")).toBeInTheDocument();
  });

  it("signs out when the logout button is clicked", async () => {
    const logoutApp = vi.fn();
    mockedUseAuth.mockReturnValue(
      createMockAuth({
        isAdmin: false,
        user: regularUser,
        logoutApp,
        logoutPending: false,
      }),
    );
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.click(screen.getByTestId("logout_button"));
    expect(logoutApp).toHaveBeenCalled();
  });
});
