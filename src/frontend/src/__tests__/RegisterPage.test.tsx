import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigateMock = vi.fn();
const registerMock = vi.fn();

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
  useNavigate: () => navigateMock,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    register: registerMock,
    registerPending: false,
  }),
}));

import { RegisterPage } from "@/pages/RegisterPage";

describe("RegisterPage", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    registerMock.mockReset();
  });

  it("shows password strength and disables submit for a weak password", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByTestId("register.name_input"), "Alice");
    await user.type(
      screen.getByTestId("register.email_input"),
      "alice@example.com",
    );
    await user.type(screen.getByTestId("register.password_input"), "short");

    expect(screen.getByTestId("register.strength_label")).toHaveTextContent(
      "WEAK",
    );
    expect(screen.getByTestId("register.submit_button")).toBeDisabled();
  });

  it("enables submit for a strong password and calls register", async () => {
    const user = userEvent.setup();
    registerMock.mockResolvedValue(true);
    render(<RegisterPage />);

    await user.type(screen.getByTestId("register.name_input"), "Alice");
    await user.type(
      screen.getByTestId("register.email_input"),
      "alice@example.com",
    );
    await user.type(
      screen.getByTestId("register.password_input"),
      "Str0ng!Pass",
    );

    expect(screen.getByTestId("register.strength_label")).toHaveTextContent(
      "STRONG",
    );
    const submit = screen.getByTestId("register.submit_button");
    expect(submit).toBeEnabled();

    await user.click(submit);
    await waitFor(() =>
      expect(registerMock).toHaveBeenCalledWith({
        name: "Alice",
        email: "alice@example.com",
        password: "Str0ng!Pass",
      }),
    );
    expect(navigateMock).toHaveBeenCalledWith({ to: "/dashboard" });
  });

  it("shows an error when registration fails", async () => {
    const user = userEvent.setup();
    registerMock.mockResolvedValue(false);
    render(<RegisterPage />);

    await user.type(screen.getByTestId("register.name_input"), "Alice");
    await user.type(
      screen.getByTestId("register.email_input"),
      "alice@example.com",
    );
    await user.type(
      screen.getByTestId("register.password_input"),
      "Str0ng!Pass",
    );
    await user.click(screen.getByTestId("register.submit_button"));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /registration failed/i,
      ),
    );
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
