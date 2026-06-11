import { z } from "zod";

export const userFormSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(60, "First name must be 60 characters or fewer"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(60, "Last name must be 60 characters or fewer"),
  email: z.string().trim().email("Enter a valid email address"),
  username: z
    .string()
    .trim()
    .max(60, "Username must be 60 characters or fewer")
    .optional()
    .or(z.literal("")),
  departmentId: z.string().optional().or(z.literal("")),
});

export const roleAssignmentSchema = z.object({
  roleIds: z.array(z.string()).min(1, "Select at least one role"),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
export type RoleAssignmentFormValues = z.infer<typeof roleAssignmentSchema>;

export const createUserSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters long")
    .max(120, "Full name must be 120 characters or fewer"),
  email: z.string().trim().email("Enter a valid email address"),
  username: z
    .string()
    .trim()
    .max(60, "Username must be 60 characters or fewer")
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must be 128 characters or fewer"),
  role: z.string().optional().or(z.literal("")),
  departmentId: z.string().optional().or(z.literal("")),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
