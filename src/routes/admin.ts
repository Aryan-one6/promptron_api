import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { categorySchema, modelSchema, platformSchema, tagSchema } from "../validators/admin";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.post("/platforms", async (req, res, next) => {
  try {
    const payload = platformSchema.parse(req.body);
    const platform = await prisma.platform.create({ data: payload });
    return res.status(201).json(platform);
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/platforms/:id", async (req, res, next) => {
  try {
    const payload = platformSchema.partial().parse(req.body);
    const platform = await prisma.platform.update({
      where: { id: req.params.id },
      data: payload
    });
    return res.json(platform);
  } catch (error) {
    return next(error);
  }
});

adminRouter.delete("/platforms/:id", async (req, res) => {
  await prisma.platform.delete({ where: { id: req.params.id } });
  return res.status(204).send();
});

adminRouter.post("/models", async (req, res, next) => {
  try {
    const payload = modelSchema.parse(req.body);
    const model = await prisma.model.create({ data: payload });
    return res.status(201).json(model);
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/models/:id", async (req, res, next) => {
  try {
    const payload = modelSchema.partial().parse(req.body);
    const model = await prisma.model.update({
      where: { id: req.params.id },
      data: payload
    });
    return res.json(model);
  } catch (error) {
    return next(error);
  }
});

adminRouter.delete("/models/:id", async (req, res) => {
  await prisma.model.delete({ where: { id: req.params.id } });
  return res.status(204).send();
});

adminRouter.post("/categories", async (req, res, next) => {
  try {
    const payload = categorySchema.parse(req.body);
    const category = await prisma.category.create({ data: payload });
    return res.status(201).json(category);
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/categories/:id", async (req, res, next) => {
  try {
    const payload = categorySchema.partial().parse(req.body);
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: payload
    });
    return res.json(category);
  } catch (error) {
    return next(error);
  }
});

adminRouter.delete("/categories/:id", async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  return res.status(204).send();
});

adminRouter.post("/tags", async (req, res, next) => {
  try {
    const payload = tagSchema.parse(req.body);
    const tag = await prisma.tag.create({ data: payload });
    return res.status(201).json(tag);
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/tags/:id", async (req, res, next) => {
  try {
    const payload = tagSchema.partial().parse(req.body);
    const tag = await prisma.tag.update({
      where: { id: req.params.id },
      data: payload
    });
    return res.json(tag);
  } catch (error) {
    return next(error);
  }
});

adminRouter.delete("/tags/:id", async (req, res) => {
  await prisma.tag.delete({ where: { id: req.params.id } });
  return res.status(204).send();
});

adminRouter.patch("/templates/:id/feature", async (req, res) => {
  const template = await prisma.template.update({
    where: { id: req.params.id },
    data: { isFeatured: true }
  });
  return res.json(template);
});

adminRouter.patch("/templates/:id/unfeature", async (req, res) => {
  const template = await prisma.template.update({
    where: { id: req.params.id },
    data: { isFeatured: false }
  });
  return res.json(template);
});
