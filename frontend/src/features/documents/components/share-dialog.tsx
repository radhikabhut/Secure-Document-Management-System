import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { getDocumentErrorMessage } from "@/features/documents/api";
import {
  shareDocumentSchema,
  type ShareDocumentFormValues,
} from "@/features/documents/schemas";
import { getUsers } from "@/features/users/api";
import { useAuthStore } from "@/store/auth-store";
import axiosInstance from "@/lib/axios";

import type { Document } from "@/types/document";

interface ShareDialogProps {
  document: Document | null;
  isOpen: boolean;
  isSharing: boolean;
  onClose: () => void;
  onShare: (values: ShareDocumentFormValues) => Promise<void>;
}

const permissionOptions = [
  { label: "Read", value: "read" },
  { label: "Download", value: "download" },
  { label: "Edit", value: "edit" },
  { label: "Delete", value: "delete" },
] as const;

export function ShareDialog({
  document,
  isOpen,
  isSharing,
  onClose,
  onShare,
}: ShareDialogProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<ShareDocumentFormValues>({
    resolver: zodResolver(shareDocumentSchema),
    defaultValues: {
      userIds: [],
      roleIds: [],
      departments: [],
      permissions: ["read"],
    },
  });

  const [searchQuery, setSearchQuery] = useState("");
  const currentUser = useAuthStore((state) => state.user);

  const usersQuery = useQuery({
    queryKey: ["users", "share", searchQuery],
    queryFn: () =>
      getUsers({ page: 1, pageSize: 50, search: searchQuery, status: "active" }),
    enabled: isOpen,
  });

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/departments');
      return data.data;
    },
    enabled: isOpen,
  });

  if (!isOpen || !document) {
    return null;
  }

  const fetchedUsers = usersQuery.data?.items ?? [];

  const userOptions = fetchedUsers
    .filter((user) => user.id !== currentUser?.id)
    .map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim() || user.email,
      description: user.email,
    }));

  const roleOptions = [
    { id: "ADMIN", name: "Admin", description: "Full system access" },
    { id: "MANAGER", name: "Manager", description: "Department management" },
    { id: "EMPLOYEE", name: "Employee", description: "Standard access" },
    { id: "VIEWER", name: "Viewer", description: "Read-only access" },
  ];

  const departmentOptions = departmentsQuery.data ?? [];

  const handleClose = () => {
    if (isSharing) {
      return;
    }

    reset();
    onClose();
  };

  const onSubmit = async (values: ShareDocumentFormValues) => {
    try {
      await onShare(values);
      const totalRecipients = values.userIds.length + values.roleIds.length;
      toast.success(`Document shared successfully with ${totalRecipients} recipient(s)`);
      handleClose();
    } catch (error) {
      const message = getDocumentErrorMessage(error);

      setError("root", { message });
      toast.error(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        aria-label="Close share dialog"
        className="absolute inset-0 bg-slate-950/40"
        type="button"
        onClick={handleClose}
      />
      <section className="relative w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-950">
              Share document
            </h2>
            <p className="mt-1 truncate text-sm text-slate-600">
              {document.title}
            </p>
          </div>
          <button
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            disabled={isSharing}
            type="button"
            onClick={handleClose}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form className="flex flex-col min-h-0" onSubmit={handleSubmit(onSubmit)}>
          <div className="overflow-y-auto p-5 space-y-5">
            <div className="space-y-2">
            <p className="text-sm font-medium text-slate-800">
              Select Users
            </p>
            <input
              type="text"
              placeholder="Search users by name or email..."
              className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            {usersQuery.isLoading ? (
              <div className="flex justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              </div>
            ) : usersQuery.isError ? (
              <div className="rounded-md border border-dashed border-red-300 bg-red-50 px-4 py-6 text-center text-sm text-red-600">
                Failed to load users.
              </div>
            ) : userOptions.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No users available.
              </div>
            ) : (
              <div className="max-h-32 space-y-2 overflow-y-auto rounded-md border border-slate-200 p-2">
                {userOptions.map((option) => (
                  <label
                    className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 transition hover:bg-slate-50"
                    key={option.id}
                  >
                    <input
                      className="mt-1"
                      type="checkbox"
                      value={option.id}
                      {...register("userIds")}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-900">
                        {option.name}
                      </span>
                      {option.description ? (
                        <span className="block truncate text-xs text-slate-500">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {errors.userIds ? (
              <p className="text-sm text-red-600">{errors.userIds.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-800">
              Select Roles
            </p>
            {roleOptions.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No roles available.
              </div>
            ) : (
              <div className="max-h-32 space-y-2 overflow-y-auto rounded-md border border-slate-200 p-2">
                {roleOptions.map((option) => (
                  <label
                    className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 transition hover:bg-slate-50"
                    key={option.id}
                  >
                    <input
                      className="mt-1"
                      type="checkbox"
                      value={option.id}
                      {...register("roleIds")}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-900">
                        {option.name}
                      </span>
                      {option.description ? (
                        <span className="block truncate text-xs text-slate-500">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-800">
              Select Departments
            </p>
            {departmentsQuery.isLoading ? (
               <div className="flex justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6">
                 <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
               </div>
            ) : departmentOptions.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No departments available.
              </div>
            ) : (
              <div className="max-h-32 space-y-2 overflow-y-auto rounded-md border border-slate-200 p-2">
                {departmentOptions.map((option: any) => (
                  <label
                    className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 transition hover:bg-slate-50"
                    key={option.id}
                  >
                    <input
                      className="mt-1"
                      type="checkbox"
                      value={option.name}
                      {...register("departments")}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-900">
                        {option.name}
                      </span>
                      {option.description ? (
                        <span className="block truncate text-xs text-slate-500">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-800">Permissions</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {permissionOptions.map((permission) => (
                <label
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                  key={permission.value}
                >
                  <input
                    type="checkbox"
                    value={permission.value}
                    {...register("permissions")}
                  />
                  {permission.label}
                </label>
              ))}
            </div>
            {errors.permissions ? (
              <p className="text-sm text-red-600">
                {errors.permissions.message}
              </p>
            ) : null}
          </div>

          {errors.root?.message ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 mt-4">
              {errors.root.message}
            </p>
          ) : null}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 p-4 shrink-0 bg-slate-50 rounded-b-lg">
            <button
              className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSharing}
              type="button"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              className="h-10 rounded-md bg-blue-700 px-4 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSharing}
              type="submit"
            >
              {isSharing ? "Sharing..." : "Share"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
