import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createActor } from "@/backend";
import type { AccountStatus } from "@/backend";
import type { Principal } from "@icp-sdk/core/principal";

/** Admin: every file stored in the vault across all users. */
export function useAdminFiles() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["adminFiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAllFiles();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Admin: every share record across all users. */
export function useAllShares() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["allShares"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAllShares();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Admin: every registered user account. */
export function useAllUsers() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Admin: shares the caller owns (shared links they created). */
export function useOwnerShares() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["ownerShares"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listOwnerShares();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Admin: shares received by the caller. */
export function useReceivedShares() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["receivedShares"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listSharesForUser();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Admin: full platform audit log. */
export function useAllLogs() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["allLogs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllLogs();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Admin: failed login attempts with email and timestamp. */
export function useFailedLogins() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["failedLogins"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listFailedLogins();
    },
    enabled: !!actor && !isFetching,
  });
}

/** The current user's own audit activity log. */
export function useMyActivity() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["myActivity"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyActivity();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Admin: activate or deactivate a user account. */
export function useSetAccountStatus() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      target,
      status,
    }: {
      target: Principal;
      status: AccountStatus;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setAccountStatus(target, status);
    },
    onSuccess: (result) => {
      if (result.__kind__ === "ok") {
        toast.success("Account status updated");
      } else {
        toast.error("Unable to update account status");
      }
      void queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}
