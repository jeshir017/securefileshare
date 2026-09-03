import { Ban, CheckCircle2, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";

import { AccountStatus, type User } from "@/backend";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAllUsers, useSetAccountStatus } from "@/hooks/useQueries";
import { formatDate, formatPrincipal } from "@/lib/format";

const SKELETON_KEYS = [
  "skeleton-1",
  "skeleton-2",
  "skeleton-3",
  "skeleton-4",
  "skeleton-5",
];

export function UserManagementPage() {
  const users = useAllUsers();
  const setStatus = useSetAccountStatus();
  const [pendingAction, setPendingAction] = useState<{
    user: User;
    status: AccountStatus;
  } | null>(null);

  const userList = users.data ?? [];

  const handleConfirm = () => {
    if (!pendingAction) return;
    setStatus.mutate(
      { target: pendingAction.user.principal, status: pendingAction.status },
      {
        onSettled: () => setPendingAction(null),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          User Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Activate and deactivate user accounts. Account status controls whether
          a user can sign in and access the vault.
        </p>
      </div>

      <Card className="shadow-subtle">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <UserRound className="size-4 text-primary" />
            Registered Users
            <span className="ml-auto font-mono text-xs font-normal text-muted-foreground">
              {userList.length} total
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.isLoading ? (
            <div className="space-y-3" data-ocid="loading_state">
              {SKELETON_KEYS.map((key) => (
                <Skeleton key={key} className="h-12 w-full" />
              ))}
            </div>
          ) : userList.length === 0 ? (
            <div
              className="flex flex-col items-center gap-2 py-12 text-center"
              data-ocid="empty_state"
            >
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <UserRound className="size-5 text-muted-foreground" />
              </div>
              <p className="font-display text-sm font-semibold">
                No users found
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Registered users will appear here for account management.
              </p>
            </div>
          ) : (
            <Table data-ocid="users_table">
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userList.map((user, i) => {
                  const isActive = user.status === AccountStatus.active;
                  return (
                    <TableRow
                      key={user.principal.toString()}
                      data-ocid={`user.row.${i + 1}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 font-display text-sm font-bold text-primary">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{user.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {formatPrincipal(user.principal.toString())}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          tone={isActive ? "success" : "destructive"}
                          pulse={isActive}
                        >
                          {isActive ? "Active" : "Deactivated"}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isActive ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setPendingAction({
                                user,
                                status: AccountStatus.deactivated,
                              })
                            }
                            disabled={setStatus.isPending}
                            data-ocid={`deactivate_button.${i + 1}`}
                          >
                            <Ban className="size-4" />
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setPendingAction({
                                user,
                                status: AccountStatus.active,
                              })
                            }
                            disabled={setStatus.isPending}
                            data-ocid={`activate_button.${i + 1}`}
                          >
                            <CheckCircle2 className="size-4" />
                            Activate
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        title={
          pendingAction?.status === AccountStatus.deactivated
            ? "Deactivate account?"
            : "Activate account?"
        }
        description={
          pendingAction?.status === AccountStatus.deactivated
            ? `This will deactivate ${pendingAction?.user.name}'s account and prevent them from signing in. You can reactivate it at any time.`
            : `This will reactivate ${pendingAction?.user.name}'s account and restore their access to the vault.`
        }
        confirmLabel={
          pendingAction?.status === AccountStatus.deactivated
            ? "Deactivate"
            : "Activate"
        }
        destructive={pendingAction?.status === AccountStatus.deactivated}
        isPending={setStatus.isPending}
        onConfirm={handleConfirm}
      />

      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 text-primary" />
        <span>
          Account status changes take effect immediately and are recorded in the
          security audit log.
        </span>
      </div>
    </div>
  );
}
