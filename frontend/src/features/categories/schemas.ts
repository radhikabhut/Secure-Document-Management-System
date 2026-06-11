import { z } from "zod";

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(80, "Name must be 80 characters or fewer"),
  description: z
    .string()
    .trim()
    .max(300, "Description must be 300 characters or fewer")
    .optional()
    .or(z.literal("")),
  parentId: z.string().optional().or(z.literal("")),
  isActive: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
