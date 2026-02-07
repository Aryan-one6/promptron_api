import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const savedRouter = Router();

savedRouter.post("/templates/:id/save", requireAuth, async (req, res) => {
  const template = await prisma.template.findUnique({ where: { id: req.params.id } });
  if (!template || (!template.isPublic && template.authorId !== req.user!.sub)) {
    return res.status(404).json({ message: "Template not found" });
  }

  await prisma.savedTemplate.upsert({
    where: { userId_templateId: { userId: req.user!.sub, templateId: template.id } },
    update: {},
    create: { userId: req.user!.sub, templateId: template.id }
  });

  return res.status(201).json({ message: "Saved" });
});

savedRouter.delete("/templates/:id/save", requireAuth, async (req, res) => {
  await prisma.savedTemplate.deleteMany({
    where: { userId: req.user!.sub, templateId: req.params.id }
  });
  return res.status(204).send();
});

savedRouter.get("/me/saved", requireAuth, async (req, res) => {
  const saved = await prisma.savedTemplate.findMany({
    where: { userId: req.user!.sub },
    include: {
      template: {
        include: {
          category: true,
          author: true,
          models: { include: { model: { include: { platform: true } } } },
          tags: { include: { tag: true } },
          _count: { select: { savedBy: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return res.json(saved.map((item) => item.template));
});
