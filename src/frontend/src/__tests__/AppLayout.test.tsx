import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockAuth, regularUser } from "./mocks";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

const navigateToMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Navigate: ({ to }: { to: string }) => {
    navigateToMock(to);
    return null;
  },
  Outlet: () => <div data-ocid="protected-outlet">Protected content</div>,
  useLocation: () => ({ pathname: "/dashboard" }),
  Link: ({
    children,
    to,
    ...rest
  }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";

const mockedUseAuth = vi.mocked(useAuth);

describe("AppLayout protected-route guard", () => {
  beforeEach(() => {
    navigateToMock.mockReset();
  });

  it("renders the protected outlet when authenticated", () => {
    mockedUseAuth.mockReturnValue(
      createMockAuth({
        isAuthenticated: true,
        isInitializing: false,
        user: regularUser,
      }),
    );
    render(<AppLayout />);
    expect(screen.getByTestId("protected-outlet")).toBeInTheDocument();
    expect(navigateToMock).not.toHaveBeenCalled();
  });

  it("redirects to /login when not authenticated", () => {
    mockedUseAuth.mockReturnValue(
      createMockAuth({
        isAuthenticated: false,
        isInitializing: false,
        user: null,
      }),
    );
    render(<AppLayout />);
    expect(navigateToMock).toHaveBeenCalledWith("/login");
    expect(screen.queryByTestId("protected-outlet")).not.toBeInTheDocument();
  });

  it("does not redirect while still initializing", () => {
    mockedUseAuth.mockReturnValue(
      createMockAuth({
        isAuthenticated: false,
        isInitializing: true,
        user: null,
      }),
    );
    render(<AppLayout />);
    expect(navigateToMock).not.toHaveBeenCalled();
  });
});
