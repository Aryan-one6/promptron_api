import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const meRouter = Router();

meRouter.get("/me/generated", requireAuth, async (req, res) => {
  const prompts = await prisma.generatedPrompt.findMany({
    where: { userId: req.user!.sub },
    include: { platform: true, model: true },
    orderBy: { createdAt: "desc" }
  });
  return res.json(prompts);
});

meRouter.get("/me/templates", requireAuth, async (req, res) => {
  const templates = await prisma.template.findMany({
    where: { authorId: req.user!.sub },
    include: {
      category: true,
      author: true,
      models: { include: { model: { include: { platform: true } } } },
      tags: { include: { tag: true } },
      _count: { select: { savedBy: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  return res.json(templates);
});
