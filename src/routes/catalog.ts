import { Router } from "express";
import { prisma } from "../lib/prisma";
import {
  createAccessToken,
  setAuthCookies,
  verifyAccessToken,
  verifyRefreshToken
} from "../lib/auth";

export const catalogRouter = Router();

catalogRouter.get("/platforms", async (_req, res) => {
  const platforms = await prisma.platform.findMany({
    orderBy: { name: "asc" }
  });
  return res.json(platforms);
});

catalogRouter.get("/models", async (req, res) => {
  const platformSlug = req.query.platform as string | undefined;
  const where = platformSlug
    ? { platform: { slug: platformSlug }, isActive: true }
    : { isActive: true };

  const models = await prisma.model.findMany({
    where,
    include: { platform: true },
    orderBy: { name: "asc" }
  });
  return res.json(models);
});

catalogRouter.get("/categories", async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" }
  });
  return res.json(categories);
});

catalogRouter.get("/tags", async (_req, res) => {
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  return res.json(tags);
});

catalogRouter.get("/templates", async (req, res, next) => {
  try {
    const { platform, model, category, tags, search, sort, author } = req.query as {
      platform?: string;
      model?: string;
      category?: string;
      tags?: string;
      search?: string;
      sort?: string;
      author?: string;
    };

    const tagList = tags ? tags.split(",").filter(Boolean) : [];

    if (author === "me") {
      const access = req.cookies?.promptly_access as string | undefined;
      const refresh = req.cookies?.promptly_refresh as string | undefined;

      if (!access && !refresh) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      try {
        if (access) {
          req.user = verifyAccessToken(access);
        } else if (refresh) {
          const payload = verifyRefreshToken(refresh);
          const newAccess = createAccessToken(payload);
          setAuthCookies(res, newAccess, refresh);
          req.user = payload;
        }
      } catch {
        return res.status(401).json({ message: "Unauthorized" });
      }
    }

    const where = {
      AND: [
        author === "me" ? { authorId: req.user?.sub } : { isPublic: true },
        platform
          ? {
              models: {
                some: { model: { platform: { slug: platform } } }
              }
            }
          : {},
        model
          ? {
              models: {
                some: { model: { slug: model } }
              }
            }
          : {},
        category ? { category: { slug: category } } : {},
        tagList.length
          ? {
              tags: {
                some: { tag: { slug: { in: tagList } } }
              }
            }
          : {},
        search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } }
              ]
            }
          : {}
      ]
    };

    const orderBy = (() => {
      switch (sort) {
        case "newest":
          return { createdAt: "desc" } as const;
        case "mostSaved":
        case "trending":
          return { savedBy: { _count: "desc" } } as const;
        default:
          return { createdAt: "desc" } as const;
      }
    })();

    const templates = await prisma.template.findMany({
      where,
      include: {
        category: true,
        author: true,
        models: { include: { model: { include: { platform: true } } } },
        tags: { include: { tag: true } },
        _count: { select: { savedBy: true } }
      },
      orderBy
    });

    return res.json(templates);
  } catch (error) {
    return next(error);
  }
});

catalogRouter.get("/templates/:id", async (req, res) => {
  const access = req.cookies?.promptly_access as string | undefined;
  const refresh = req.cookies?.promptly_refresh as string | undefined;

  try {
    if (access) {
      req.user = verifyAccessToken(access);
    } else if (refresh) {
      const payload = verifyRefreshToken(refresh);
      const newAccess = createAccessToken(payload);
      setAuthCookies(res, newAccess, refresh);
      req.user = payload;
    }
  } catch {
    // Ignore token errors for public template access.
  }

  const template = await prisma.template.findUnique({
    where: { id: req.params.id },
    include: {
      category: true,
      author: true,
      models: { include: { model: { include: { platform: true } } } },
      tags: { include: { tag: true } },
      _count: { select: { savedBy: true } }
    }
  });

  if (
    !template ||
    (!template.isPublic &&
      template.authorId !== req.user?.sub &&
      req.user?.role !== "ADMIN")
  ) {
    return res.status(404).json({ message: "Template not found" });
  }

  return res.json(template);
});
