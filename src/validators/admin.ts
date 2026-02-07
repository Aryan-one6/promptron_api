import { z } from "zod";

export const platformSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2)
});

export const modelSchema = z.object({
  platformId: z.string().min(1),
  name: z.string().min(2),
  slug: z.string().min(2),
  isActive: z.boolean().optional().default(true)
});

export const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2)
});

export const tagSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2)
});
