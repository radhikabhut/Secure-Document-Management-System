import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { ApiResponse } from "@/types/api";
import { ChangePasswordForm } from "@/features/profile/components/change-password-form";
import { ProfileCard } from "@/features/profile/components/profile-card";
import { EditProfileDialog } from "@/features/profile/components/edit-profile-dialog";
import { getProfile } from "@/features/profile/api";
import { updateUser } from "@/features/users/api";
import type { UserFormValues } from "@/features/users/schemas";
import { useAuthStore } from "@/store/auth-store";

const profileQueryKey = ["profile", "me"] as const;

const getProfileErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.errors?.[0]?.message ??
      "Unable to load profile."
    );
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to load profile.";
};

export function ProfilePage() {
  const storedUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const profileQuery = useQuery({
    queryKey: profileQueryKey,
    queryFn: getProfile,
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: UserFormValues }) =>
      updateUser({ id, values }),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      void queryClient.invalidateQueries({ queryKey: profileQueryKey });
      setIsEditDialogOpen(false);
    },
  });

  useEffect(() => {
    if (profileQuery.data) {
      setUser(profileQuery.data);
    }
  }, [profileQuery.data, setUser]);

  const user = profileQuery.data ?? storedUser;

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-2xl font-semibold text-slate-950">Profile</h1>
        <p className="mt-1 text-sm text-slate-600">
          Review your account details and security settings.
        </p>
      </section>

      {profileQuery.isError ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-red-700">
              {getProfileErrorMessage(profileQuery.error)}
            </p>
            <button
              className="h-9 rounded-md border border-red-300 bg-white px-3 text-sm font-medium text-red-700 transition hover:bg-red-100"
              type="button"
              onClick={() => void profileQuery.refetch()}
            >
              Retry
            </button>
          </div>
        </section>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <ProfileCard
          isLoading={profileQuery.isLoading}
          user={user}
          onEdit={() => setIsEditDialogOpen(true)}
        />
        <ChangePasswordForm />
      </div>

      <EditProfileDialog
        isOpen={isEditDialogOpen}
        isSubmitting={updateProfileMutation.isPending}
        user={user}
        onClose={() => setIsEditDialogOpen(false)}
        onSubmit={async (values) => {
          if (user) {
            await updateProfileMutation.mutateAsync({ id: user.id, values });
          }
        }}
      />
    </div>
  );
}