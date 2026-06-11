export type RoleName =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MANAGER'
  | 'EMPLOYEE'
  | 'VIEWER';

export type Permission = string;

export interface Role {
  id: string;
  name: RoleName | string;
  description?: string;
  permissions: Permission[];
  isSystem?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
  avatarUrl?: string;
  roles: Role[];
  departmentId?: string;
  department?: string;
  isActive: boolean;
  isEmailVerified?: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  refreshToken?: string;
}

export interface AuthSession {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  user: User;
}

export interface JwtPayload {
  sub?: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
  exp?: number;
  iat?: number;
  iss?: string;
  aud?: string | string[];
}
