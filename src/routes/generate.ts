import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { generateSchema } from "../validators/generate";
import { buildPrompt } from "../utils/promptEngine";

export const generateRouter = Router();

generateRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const payload = generateSchema.parse(req.body);

    const platform = await prisma.platform.findUnique({
      where: { id: payload.platformId }
    });
    const model = await prisma.model.findUnique({ where: { id: payload.modelId } });

    if (!platform || !model) {
      return res.status(400).json({ message: "Invalid platform or model" });
    }

    if (model.platformId !== platform.id) {
      return res.status(400).json({ message: "Model does not belong to platform" });
    }

    const template = payload.templateId
      ? await prisma.template.findUnique({ where: { id: payload.templateId } })
      : null;

    const finalPrompt = buildPrompt({
      platform,
      model,
      inputs: payload.inputs,
      schema: template?.promptSchema as any
    });

    const record = await prisma.generatedPrompt.create({
      data: {
        userId: req.user!.sub,
        platformId: platform.id,
        modelId: model.id,
        inputs: payload.inputs,
        finalPrompt
      }
    });

    return res.status(201).json({
      id: record.id,
      finalPrompt,
      createdAt: record.createdAt
    });
  } catch (error) {
    return next(error);
  }
});

generateRouter.get("/me", requireAuth, async (req, res) => {
  const prompts = await prisma.generatedPrompt.findMany({
    where: { userId: req.user!.sub },
    include: {
      platform: true,
      model: true
    },
    orderBy: { createdAt: "desc" }
  });
  return res.json(prompts);
});
