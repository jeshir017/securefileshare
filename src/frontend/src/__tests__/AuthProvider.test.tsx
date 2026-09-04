import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockActor } from "./mocks";

const { initializeAccessControlMock } = vi.hoisted(() => ({
  initializeAccessControlMock: vi.fn(),
}));

type AuthActor = ReturnType<typeof createMockActor> & {
  _initialize_access_control: ReturnType<typeof vi.fn>;
};

let mockActor: AuthActor;

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: mockActor, isFetching: false }),
  useInternetIdentity: () => ({
    identity: undefined,
    isInitializing: false,
    isLoggingIn: false,
    login: vi.fn(),
    clear: vi.fn(),
  }),
}));

vi.mock("@/backend", () => ({
  createActor: vi.fn(),
  AccountStatus: {
    active: "active",
    deactivated: "deactivated",
  },
  AuditAction: {
    unauthorizedAccess: "unauthorizedAccess",
    linkCreate: "linkCreate",
    failedLogin: "failedLogin",
    logout: "logout",
    delete_: "delete",
    login: "login",
    share: "share",
    upload: "upload",
    download: "download",
    linkRevoke: "linkRevoke",
  },
  AuthError: {
    accountDeactivated: "accountDeactivated",
    emailTaken: "emailTaken",
    weakPassword: "weakPassword",
    notRegistered: "notRegistered",
    unauthorized: "unauthorized",
    invalidCredentials: "invalidCredentials",
  },
  SharePermission: {
    view: "view",
    download: "download",
  },
  UserRole: {
    admin: "admin",
    user: "user",
    guest: "guest",
  },
}));

import { AuthProvider, useAuth } from "@/hooks/useAuth";

function AuthHarness() {
  const { loginApp, register } = useAuth();
  return (
    <div>
      <button
        type="button"
        onClick={() => loginApp({ email: "a@b.com", password: "pw" })}
        data-ocid="auth.login"
      >
        login
      </button>
      <button
        type="button"
        onClick={() =>
          register({ name: "A", email: "a@b.com", password: "pw" })
        }
        data-ocid="auth.register"
      >
        register
      </button>
    </div>
  );
}

function renderAuth() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("AuthProvider access-control registration", () => {
  beforeEach(() => {
    mockActor = {
      ...createMockActor(),
      _initialize_access_control: initializeAccessControlMock,
    };
    initializeAccessControlMock.mockReset();
    initializeAccessControlMock.mockResolvedValue(undefined);
  });

  it("registers the signed-in caller after a successful login", async () => {
    const user = userEvent.setup();
    renderAuth();

    await user.click(screen.getByTestId("auth.login"));

    await waitFor(() => expect(initializeAccessControlMock).toHaveBeenCalled());
  });

  it("registers the signed-in caller after a successful register", async () => {
    const user = userEvent.setup();
    renderAuth();

    await user.click(screen.getByTestId("auth.register"));

    await waitFor(() => expect(initializeAccessControlMock).toHaveBeenCalled());
  });
});
