import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { templateSchema, templateUpdateSchema } from "../validators/template";

export const templatesRouter = Router();

templatesRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const payload = templateSchema.parse(req.body);

    const template = await prisma.template.create({
      data: {
        title: payload.title,
        description: payload.description,
        promptSchema: payload.promptSchema,
        authorId: req.user!.sub,
        categoryId: payload.categoryId,
        isPublic: payload.isPublic
      }
    });

    await prisma.templateModel.createMany({
      data: payload.modelIds.map((modelId) => ({
        templateId: template.id,
        modelId
      }))
    });

    if (payload.tagIds?.length) {
      await prisma.templateTag.createMany({
        data: payload.tagIds.map((tagId) => ({
          templateId: template.id,
          tagId
        }))
      });
    }

    const result = await prisma.template.findUnique({
      where: { id: template.id },
      include: {
        category: true,
        author: true,
        models: { include: { model: { include: { platform: true } } } },
        tags: { include: { tag: true } },
        _count: { select: { savedBy: true } }
      }
    });

    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
});

templatesRouter.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const payload = templateUpdateSchema.parse(req.body);
    const existing = await prisma.template.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ message: "Template not found" });
    }
    if (existing.authorId !== req.user!.sub && req.user!.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const template = await prisma.template.update({
      where: { id: existing.id },
      data: {
        title: payload.title,
        description: payload.description,
        promptSchema: payload.promptSchema,
        categoryId: payload.categoryId,
        isPublic: payload.isPublic
      }
    });

    if (payload.modelIds) {
      await prisma.templateModel.deleteMany({ where: { templateId: template.id } });
      await prisma.templateModel.createMany({
        data: payload.modelIds.map((modelId) => ({
          templateId: template.id,
          modelId
        }))
      });
    }

    if (payload.tagIds) {
      await prisma.templateTag.deleteMany({ where: { templateId: template.id } });
      if (payload.tagIds.length) {
        await prisma.templateTag.createMany({
          data: payload.tagIds.map((tagId) => ({
            templateId: template.id,
            tagId
          }))
        });
      }
    }

    const result = await prisma.template.findUnique({
      where: { id: template.id },
      include: {
        category: true,
        author: true,
        models: { include: { model: { include: { platform: true } } } },
        tags: { include: { tag: true } },
        _count: { select: { savedBy: true } }
      }
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

templatesRouter.delete("/:id", requireAuth, async (req, res) => {
  const template = await prisma.template.findUnique({ where: { id: req.params.id } });
  if (!template) {
    return res.status(404).json({ message: "Template not found" });
  }
  if (template.authorId !== req.user!.sub && req.user!.role !== "ADMIN") {
    return res.status(403).json({ message: "Forbidden" });
  }

  await prisma.template.delete({ where: { id: template.id } });
  return res.status(204).send();
});
