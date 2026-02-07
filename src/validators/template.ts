import { z } from "zod";

export const templateSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  promptSchema: z.record(z.any()),
  categoryId: z.string().min(1),
  modelIds: z.array(z.string()).min(1),
  tagIds: z.array(z.string()).optional().default([]),
  isPublic: z.boolean().optional().default(true)
});

export const templateUpdateSchema = templateSchema.partial();
