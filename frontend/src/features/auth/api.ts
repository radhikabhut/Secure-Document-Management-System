import axios from "axios";
import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { AuthSession, User } from "@/types/auth";
import type {
  ForgotPasswordFormValues,
  LoginFormValues,
  RegisterFormValues,
  ResetPasswordFormValues,
} from "./schemas";

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
}

export type RegisterResponse = User;

export const loginRequest = async (
  payload: LoginFormValues,
): Promise<AuthSession> => {
  const response = await axiosInstance.post("/auth/login", payload);

  const data = response.data.data;

  const nameParts = (data.user.full_name ?? "").trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");

  const mappedUser: User = {
    id: data.user.id,
    email: data.user.email,
    firstName,
    lastName,
    username: data.user.username || data.user.email.split("@")[0],
    isActive: data.user.is_active,
    isEmailVerified: true,
    lastLoginAt: data.user.last_login_at ?? undefined,
    createdAt: data.user.created_at,
    updatedAt: data.user.updated_at,
    roles: [
      {
        id: data.user.role_id,
        name: data.user.role,
        description: data.user.role,
        permissions: [],
        isSystem: true,
      },
    ],
  };

  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresAt: data.expires_at,
    user: mappedUser,
  };
};

export const registerRequest = async (
  values: RegisterFormValues,
): Promise<RegisterResponse> => {
  const payload: RegisterPayload = {
    full_name: values.fullName.trim(),
    email: values.email.trim(),
    password: values.password,
  };

  const response = await axiosInstance.post<ApiResponse<any>>(
    "/auth/register",
    payload,
  );

  const data = response.data.data;
  const user = data.user || data;

  const nameParts = (user.full_name ?? "").trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");

  return {
    id: user.id,
    email: user.email,
    firstName,
    lastName,
    username: user.username || user.email.split("@")[0],
    isActive: user.is_active,
    isEmailVerified: true,
    lastLoginAt: user.last_login_at ?? undefined,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    roles: [
      {
        id: user.role_id,
        name: user.role,
        description: user.role,
        permissions: [],
        isSystem: true,
      },
    ],
  };
};

export const forgotPasswordRequest = async (
  values: ForgotPasswordFormValues,
): Promise<void> => {
  await axiosInstance.post("/auth/forgot-password", {
    email: values.email.trim(),
  });
};

export const resetPasswordRequest = async ({
  token,
  values,
}: {
  token: string;
  values: ResetPasswordFormValues;
}): Promise<void> => {
  await axiosInstance.post("/auth/reset-password", {
    token,
    new_password: values.password,
  });
};

export const getAuthErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    if (error.response?.status === 429) {
      return "Too many attempts. Please wait a moment and try again.";
    }

    const responseMessage = error.response?.data?.message;

    if (responseMessage) {
      return responseMessage;
    }

    const firstError = error.response?.data?.errors?.[0]?.message;

    if (firstError) {
      return firstError;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
};
