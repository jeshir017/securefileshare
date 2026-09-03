import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
}));

vi.mock("motion/react", () => ({
  motion: {
    section: ({ children, ...rest }: { children: React.ReactNode }) => (
      <section {...rest}>{children}</section>
    ),
  },
}));

import { LandingPage } from "@/pages/LandingPage";

describe("LandingPage", () => {
  it("renders the default route without a blank screen", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("heading", { name: /encrypted file sharing/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/end-to-end encryption/i)).toBeInTheDocument();
    expect(screen.getByText(/granular access control/i)).toBeInTheDocument();
    expect(screen.getByText(/immutable audit logging/i)).toBeInTheDocument();
  });

  it("links to register and login", () => {
    render(<LandingPage />);
    expect(screen.getByRole("link", { name: /get started/i })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
