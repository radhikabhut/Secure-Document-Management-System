import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  assignUserRoles,
  createUser,
  deleteUser,
  getUserErrorMessage,
  getUsers,
  standardRoles,
  updateUser,
  updateUserStatus,
  usersQueryKey,
  type UserListParams,
} from "@/features/users/api";
import { CreateUserDialog } from "@/features/users/components/create-user-dialog";
import { RoleAssignmentDialog } from "@/features/users/components/role-assignment-dialog";
import { UserFormDialog } from "@/features/users/components/user-form-dialog";
import { UsersTable } from "@/features/users/components/users-table";
import type {
  CreateUserFormValues,
  RoleAssignmentFormValues,
  UserFormValues,
} from "@/features/users/schemas";
import type { SortDirection } from "@/types/api";
import type { User } from "@/types/auth";

type UserFilters = Pick<UserListParams, "search" | "role" | "status">;

const defaultFilters: UserFilters = {
  search: "",
  role: "",
  status: "",
};

export function UsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState<UserFilters>(defaultFilters);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roleUser, setRoleUser] = useState<User | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const params: UserListParams = useMemo(
    () => ({
      page,
      pageSize,
      search: filters.search || undefined,
      role: filters.role || undefined,
      status: filters.status || undefined,
      sortBy,
      sortDirection,
    }),
    [filters, page, pageSize, sortBy, sortDirection],
  );

  const usersQuery = useQuery({
    queryKey: usersQueryKey.list(params),
    queryFn: () => getUsers(params),
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      toast.success("User created successfully");
      setIsCreateModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: usersQueryKey.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: async () => {
      toast.success("User updated");
      await queryClient.invalidateQueries({ queryKey: usersQueryKey.all });
    },
  });

  const statusMutation = useMutation({
    mutationFn: updateUserStatus,
    onSuccess: async (_, variables) => {
      toast.success(variables.isActive ? "User activated" : "User deactivated");
      await queryClient.invalidateQueries({ queryKey: usersQueryKey.all });
    },
    onError: (error) => toast.error(getUserErrorMessage(error)),
  });

  const roleMutation = useMutation({
    mutationFn: assignUserRoles,
    onSuccess: async () => {
      toast.success("Roles updated");
      await queryClient.invalidateQueries({ queryKey: usersQueryKey.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      toast.success("User deleted");
      await queryClient.invalidateQueries({ queryKey: usersQueryKey.all });
    },
    onError: (error) => toast.error(getUserErrorMessage(error)),
  });

  const handleDeleteUser = (user: User) => {
    if (window.confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const handleCreateUserSubmit = async (values: CreateUserFormValues) => {
    try {
      await createMutation.mutateAsync(values);
    } catch (error) {
      throw new Error(getUserErrorMessage(error));
    }
  };

  const handleUserSubmit = async (values: UserFormValues) => {
    if (!editingUser) {
      return;
    }

    try {
      await updateMutation.mutateAsync({ id: editingUser.id, values });
    } catch (error) {
      throw new Error(getUserErrorMessage(error));
    }
  };

  const handleRoleSubmit = async (values: RoleAssignmentFormValues) => {
    if (!roleUser) {
      return;
    }

    try {
      await roleMutation.mutateAsync({ id: roleUser.id, values });
    } catch (error) {
      throw new Error(getUserErrorMessage(error));
    }
  };

  const handleFiltersChange = (nextFilters: UserFilters) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const handleSortChange = (
    nextSortBy: string,
    nextDirection: SortDirection,
  ) => {
    setSortBy(nextSortBy);
    setSortDirection(nextDirection);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Users</h1>
          <p className="mt-1 text-sm text-slate-600">
            Administer user access, profile details, roles, and account status.
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-medium text-white transition hover:bg-blue-800"
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create New User
        </button>
      </section>

      {usersQuery.isError ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-red-700">
              {getUserErrorMessage(usersQuery.error)}
            </p>
            <button
              className="h-9 rounded-md border border-red-300 bg-white px-3 text-sm font-medium text-red-700 transition hover:bg-red-100"
              type="button"
              onClick={() => void usersQuery.refetch()}
            >
              Retry
            </button>
          </div>
        </section>
      ) : null}

      <UsersTable
        currentPage={usersQuery.data?.currentPage ?? page}
        filters={filters}
        isLoading={usersQuery.isLoading}
        isStatusUpdating={statusMutation.isPending}
        pageSize={usersQuery.data?.pageSize ?? pageSize}
        totalItems={usersQuery.data?.totalItems ?? 0}
        totalPages={usersQuery.data?.totalPages ?? 1}
        users={usersQuery.data?.items ?? []}
        onEdit={setEditingUser}
        onFilterChange={handleFiltersChange}
        onPageChange={setPage}
        onRoleAssign={setRoleUser}
        onSortChange={handleSortChange}
        onStatusToggle={(user) =>
          statusMutation.mutate({ id: user.id, isActive: !user.isActive })
        }
        onDelete={handleDeleteUser}
      />

      <CreateUserDialog
        isOpen={isCreateModalOpen}
        isSubmitting={createMutation.isPending}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateUserSubmit}
      />

      <UserFormDialog
        isOpen={Boolean(editingUser)}
        isSubmitting={updateMutation.isPending}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSubmit={handleUserSubmit}
      />

      <RoleAssignmentDialog
        availableRoles={standardRoles}
        isOpen={Boolean(roleUser)}
        isSubmitting={roleMutation.isPending}
        user={roleUser}
        onClose={() => setRoleUser(null)}
        onSubmit={handleRoleSubmit}
      />
    </div>
  );
}
