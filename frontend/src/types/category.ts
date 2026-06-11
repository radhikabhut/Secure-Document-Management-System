import type { User } from './auth';

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  parentId?: string | null;
  parent?: Category | null;
  children?: Category[];
  documentCount?: number;
  isActive: boolean;
  createdById?: string;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  parentId?: string | null;
  isActive?: boolean;
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;
