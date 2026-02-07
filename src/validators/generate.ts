import { z } from "zod";

export const generateSchema = z.object({
  platformId: z.string().min(1),
  modelId: z.string().min(1),
  templateId: z.string().optional(),
  inputs: z.object({
    useCase: z.string().min(1),
    goal: z.string().min(3),
    context: z.string().optional().default(""),
    tone: z.string().optional().default(""),
    audience: z.string().optional().default(""),
    constraints: z.string().optional().default(""),
    outputFormat: z.string().optional().default(""),
    examples: z.string().optional().default("")
  })
});
