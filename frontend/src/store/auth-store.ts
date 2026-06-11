import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { api } from "@/lib/api";
import {
  clearAuthSession,
  getAccessToken,
  getStoredUser,
  isTokenExpired,
  setAuthTokens,
  setStoredUser,
} from "@/lib/auth";
import type { AuthSession, LoginCredentials, User } from "@/types/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => void;
  initializeAuth: () => void;
  setAuthSession: (session: AuthSession) => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: false,

      login: async (credentials) => {
        const response = await api.post<any, LoginCredentials>(
          "/auth/login",
          credentials,
        );

        const data = response.data;

        const nameParts = (data.user.full_name ?? "").trim().split(/\s+/);
        const firstName = nameParts[0] ?? "";
        const lastName = nameParts.slice(1).join(" ");

        const mappedUser: User = {
          id: data.user.id,
          email: data.user.email,
          firstName,
          lastName,
          username: data.user.email.split("@")[0],
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

        const session = {
          accessToken: data.access_token,
          tokenType: data.token_type,
          expiresAt: data.expires_at,
          user: mappedUser,
        };

        setAuthTokens({
          accessToken: session.accessToken,
          tokenType: session.tokenType,
          expiresAt: session.expiresAt,
        });

        setStoredUser(session.user);

        set({
          user: session.user,
          token: session.accessToken,
          isAuthenticated: true,
          isInitialized: true,
        });

        return session.user;
      },

      logout: () => {
        clearAuthSession();

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isInitialized: true,
        });
      },

      initializeAuth: () => {
        const persistedToken = get().token;
        const storedToken = getAccessToken() ?? persistedToken;
        const storedUser = getStoredUser() ?? get().user;

        if (!storedToken || isTokenExpired(storedToken)) {
          get().logout();
          return;
        }

        if (storedUser) {
          setStoredUser(storedUser);
        }

        set({
          user: storedUser,
          token: storedToken,
          isAuthenticated: true,
          isInitialized: true,
        });
      },

      setAuthSession: (session) => {
        const { user, accessToken, tokenType, expiresAt } = session;

        setAuthTokens({
          accessToken,
          tokenType,
          expiresAt,
        });

        setStoredUser(user);

        set({
          user,
          token: accessToken,
          isAuthenticated: true,
          isInitialized: true,
        });
      },

      setUser: (user) => {
        if (user) {
          setStoredUser(user);
        }

        set({ user });
      },
    }),
    {
      name: "docuvault.auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);








