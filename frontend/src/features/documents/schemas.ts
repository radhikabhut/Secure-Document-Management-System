import { z } from "zod";

export const uploadDocumentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters long")
    .max(160, "Title must be 160 characters or fewer"),
  categoryId: z.string().optional(),
});

export const sharePermissionSchema = z.enum([
  "read",
  "download",
  "edit",
  "delete",
]);

export const shareDocumentSchema = z.object({
  userIds: z.array(z.string()),
  roleIds: z.array(z.string()),
  departments: z.array(z.string()),
  permissions: z
    .array(sharePermissionSchema)
    .min(1, "Select at least one permission"),
}).refine(data => data.userIds.length > 0 || data.roleIds.length > 0 || data.departments.length > 0, {
  message: "Select at least one user, role, or department",
  path: ["userIds"],
});

export type UploadDocumentFormValues = z.infer<typeof uploadDocumentSchema>;
export type SharePermission = z.infer<typeof sharePermissionSchema>;
export type ShareDocumentFormValues = z.infer<typeof shareDocumentSchema>;
