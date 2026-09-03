import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigateMock = vi.fn();
const loginAppMock = vi.fn();

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
    loginApp: loginAppMock,
    loginPending: false,
  }),
}));

import { LoginPage } from "@/pages/LoginPage";

describe("LoginPage", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    loginAppMock.mockReset();
  });

  it("signs in and navigates to the dashboard on success", async () => {
    const user = userEvent.setup();
    loginAppMock.mockResolvedValue(true);
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/password/i), "Str0ng!Pass");
    await user.click(screen.getByTestId("login.submit_button"));

    await waitFor(() =>
      expect(loginAppMock).toHaveBeenCalledWith({
        email: "alice@example.com",
        password: "Str0ng!Pass",
      }),
    );
    expect(navigateMock).toHaveBeenCalledWith({ to: "/dashboard" });
  });

  it("shows an error when sign-in fails", async () => {
    const user = userEvent.setup();
    loginAppMock.mockResolvedValue(false);
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByTestId("login.submit_button"));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/sign in failed/i),
    );
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
