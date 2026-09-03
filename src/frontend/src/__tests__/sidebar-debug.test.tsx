import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { regularUser } from "./mocks";

vi.mock("@/hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...rest }: any) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useLocation: () => ({ pathname: "/dashboard" }),
}));

import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";

describe("debug", () => {
  beforeEach(() => {
    (useAuth as any).mockReturnValue({
      isAdmin: false,
      user: regularUser,
      logoutApp: vi.fn(),
      logoutPending: false,
    });
  });

  it("first", () => {
    console.log("mock calls:", (useAuth as any).mock.calls.length);
    render(<Sidebar />);
    console.log("admin present:", !!screen.queryByText("Admin Dashboard"));
    console.log("standard present:", !!screen.queryByText("Standard user"));
    expect(true).toBe(true);
  });
});
