import axiosInstance from "@/lib/axios";
import type { User } from "@/types/auth";

interface BackendProfileResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      full_name: string;
      username?: string;
      email: string;
      role_id: string;
      role: string;
      is_active: boolean;
      last_login_at: string | null;
      created_at: string;
      updated_at: string;
    };
  };
}

export const getProfile = async (): Promise<User> => {
  const response =
    await axiosInstance.get<BackendProfileResponse>("/auth/me");

  const backendUser = response.data.data.user;

  const [firstName = "", ...rest] = (backendUser.full_name ?? "").split(" ");

  return {
    id: backendUser.id,
    email: backendUser.email,
    username: backendUser.username || backendUser.email.split("@")[0],
    firstName,
    lastName: rest.join(" "),
    roles: backendUser.role
      ? [
          {
            id: backendUser.role_id,
            name: backendUser.role,
            permissions: [],
          },
        ]
      : [],
    isActive: backendUser.is_active,
    lastLoginAt: backendUser.last_login_at ?? undefined,
    createdAt: backendUser.created_at,
    updatedAt: backendUser.updated_at,
  };
};