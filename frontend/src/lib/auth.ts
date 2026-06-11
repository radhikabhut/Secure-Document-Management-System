import type { AuthTokens, JwtPayload, User } from '@/types/auth';

export const AUTH_STORAGE_KEYS = {
  accessToken: 'docuvault.accessToken',
  refreshToken: 'docuvault.refreshToken',
  expiresAt: 'docuvault.expiresAt',
  user: 'docuvault.user',
} as const;

const LEGACY_ACCESS_TOKEN_KEYS = ['accessToken', 'token', 'jwt'] as const;
const LEGACY_REFRESH_TOKEN_KEYS = ['refreshToken'] as const;

const canUseStorage = () => typeof window !== 'undefined' && Boolean(window.localStorage);

const getStorageItem = (key: string): string | null => {
  if (!canUseStorage()) {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setStorageItem = (key: string, value: string): void => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, value);
};

const removeStorageItem = (key: string): void => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(key);
};

const getFirstStoredValue = (keys: readonly string[]): string | null => {
  for (const key of keys) {
    const value = getStorageItem(key);

    if (value) {
      return value;
    }
  }

  return null;
};

export const getAccessToken = (): string | null =>
  getFirstStoredValue([AUTH_STORAGE_KEYS.accessToken, ...LEGACY_ACCESS_TOKEN_KEYS]);

export const getRefreshToken = (): string | null =>
  getFirstStoredValue([AUTH_STORAGE_KEYS.refreshToken, ...LEGACY_REFRESH_TOKEN_KEYS]);

export const setAuthTokens = (tokens: AuthTokens): void => {
  setStorageItem(AUTH_STORAGE_KEYS.accessToken, tokens.accessToken);

  if (tokens.refreshToken) {
    setStorageItem(AUTH_STORAGE_KEYS.refreshToken, tokens.refreshToken);
  }

  if (tokens.expiresAt) {
    setStorageItem(AUTH_STORAGE_KEYS.expiresAt, tokens.expiresAt);
  }
};

export const clearAuthTokens = (): void => {
  const keys = [
    ...Object.values(AUTH_STORAGE_KEYS),
    ...LEGACY_ACCESS_TOKEN_KEYS,
    ...LEGACY_REFRESH_TOKEN_KEYS,
    'docuvault.auth', // Required to prevent Zustand from reviving the token and causing an infinite redirect loop
  ];

  for (const key of keys) {
    removeStorageItem(key);
  }
};

export const getStoredUser = <TUser extends User = User>(): TUser | null => {
  const value = getStorageItem(AUTH_STORAGE_KEYS.user);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as TUser;
  } catch {
    removeStorageItem(AUTH_STORAGE_KEYS.user);
    return null;
  }
};

export const setStoredUser = (user: User): void => {
  setStorageItem(AUTH_STORAGE_KEYS.user, JSON.stringify(user));
};

export const clearStoredUser = (): void => {
  removeStorageItem(AUTH_STORAGE_KEYS.user);
};

export const clearAuthSession = (): void => {
  clearAuthTokens();
  clearStoredUser();
};

export const decodeJwtPayload = <TPayload extends JwtPayload = JwtPayload>(
  token: string,
): TPayload | null => {
  const [, payload] = token.split('.');

  if (!payload || typeof window === 'undefined') {
    return null;
  }

  try {
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      '=',
    );
    const decodedPayload = window.atob(paddedPayload);
    const jsonPayload = decodeURIComponent(
      Array.from(decodedPayload)
        .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );

    return JSON.parse(jsonPayload) as TPayload;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string, clockSkewSeconds = 30): boolean => {
  const payload = decodeJwtPayload(token);

  if (!payload?.exp) {
    return false;
  }

  const expiresAt = payload.exp * 1000;
  const skew = clockSkewSeconds * 1000;

  return Date.now() >= expiresAt - skew;
};

export const isAuthenticated = (): boolean => {
  const token = getAccessToken();

  return Boolean(token && !isTokenExpired(token));
};
