import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { toast } from "sonner";

import { createActor } from "@/backend";
import { AuthError, UserRole } from "@/backend";
import type { User } from "@/types";

function authErrorMessage(error: AuthError): string {
  switch (error) {
    case AuthError.accountDeactivated:
      return "This account has been deactivated. Contact an administrator.";
    case AuthError.emailTaken:
      return "An account with this email already exists.";
    case AuthError.weakPassword:
      return "Password is too weak. Use at least 8 characters with letters, numbers, and symbols.";
    case AuthError.notRegistered:
      return "No account found for this email.";
    case AuthError.unauthorized:
      return "You are not authorized to perform this action.";
    case AuthError.invalidCredentials:
      return "Invalid email or password.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export type RegisterInput = { name: string; email: string; password: string };
export type LoginInput = { email: string; password: string };

interface AuthContextValue {
  // Internet Identity sign-in
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoggingIn: boolean;
  identity: ReturnType<typeof useInternetIdentity>["identity"];
  login: ReturnType<typeof useInternetIdentity>["login"];
  clear: ReturnType<typeof useInternetIdentity>["clear"];
  // App account + role
  user: User | null;
  role: UserRole | null;
  isAdmin: boolean;
  authLoading: boolean;
  register: (input: RegisterInput) => Promise<boolean>;
  loginApp: (input: LoginInput) => Promise<boolean>;
  logoutApp: () => Promise<void>;
  registerPending: boolean;
  loginPending: boolean;
  logoutPending: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const ii = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const queryClient = useQueryClient();

  const { data: user } = useQuery<User | null>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUser();
    },
    enabled: !!actor && ii.isAuthenticated && !actorFetching,
  });

  const { data: role } = useQuery<UserRole | null>({
    queryKey: ["currentUserRole"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && ii.isAuthenticated && !actorFetching,
  });

  const registerMutation = useMutation({
    mutationFn: async ({ name, email, password }: RegisterInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.register(name, email, password);
    },
    onSuccess: (result) => {
      if (result.__kind__ === "ok") {
        toast.success("Account created successfully");
        void queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        void queryClient.invalidateQueries({ queryKey: ["currentUserRole"] });
      } else {
        toast.error(authErrorMessage(result.err));
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: LoginInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.login(email, password);
    },
    onSuccess: (result) => {
      if (result.__kind__ === "ok") {
        toast.success(`Welcome back, ${result.ok.name}`);
        void queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        void queryClient.invalidateQueries({ queryKey: ["currentUserRole"] });
      } else {
        toast.error(authErrorMessage(result.err));
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (!actor) return;
      await actor.logout();
    },
    onSuccess: () => {
      toast.success("Signed out");
      void queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      void queryClient.invalidateQueries({ queryKey: ["currentUserRole"] });
    },
  });

  const register = useCallback(
    async (input: RegisterInput): Promise<boolean> => {
      try {
        const result = await registerMutation.mutateAsync(input);
        return result.__kind__ === "ok";
      } catch {
        toast.error("Unable to reach the backend. Please try again.");
        return false;
      }
    },
    [registerMutation],
  );

  const loginApp = useCallback(
    async (input: LoginInput): Promise<boolean> => {
      try {
        const result = await loginMutation.mutateAsync(input);
        return result.__kind__ === "ok";
      } catch {
        toast.error("Unable to reach the backend. Please try again.");
        return false;
      }
    },
    [loginMutation],
  );

  const logoutApp = useCallback(async (): Promise<void> => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      toast.error("Unable to sign out. Please try again.");
    }
  }, [logoutMutation]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: ii.isAuthenticated,
      isInitializing: ii.isInitializing,
      isLoggingIn: ii.isLoggingIn,
      identity: ii.identity,
      login: ii.login,
      clear: ii.clear,
      user: user ?? null,
      role: role ?? null,
      isAdmin: role === UserRole.admin,
      authLoading: actorFetching || ii.isInitializing,
      register,
      loginApp,
      logoutApp,
      registerPending: registerMutation.isPending,
      loginPending: loginMutation.isPending,
      logoutPending: logoutMutation.isPending,
    }),
    [
      ii.isAuthenticated,
      ii.isInitializing,
      ii.isLoggingIn,
      ii.identity,
      ii.login,
      ii.clear,
      user,
      role,
      actorFetching,
      registerMutation.isPending,
      loginMutation.isPending,
      logoutMutation.isPending,
      register,
      loginApp,
      logoutApp,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
