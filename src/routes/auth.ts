import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { createAccessToken, createRefreshToken, clearAuthCookies, setAuthCookies } from "../lib/auth";
import { loginSchema, registerSchema } from "../validators/auth";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

authRouter.post("/register", async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: payload.email } });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        passwordHash,
        role: "USER"
      }
    });

    const access = createAccessToken({ sub: user.id, role: user.role });
    const refresh = createRefreshToken({ sub: user.id, role: user.role });
    setAuthCookies(res, access, refresh);

    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const access = createAccessToken({ sub: user.id, role: user.role });
    const refresh = createRefreshToken({ sub: user.id, role: user.role });
    setAuthCookies(res, access, refresh);

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/logout", (req, res) => {
  clearAuthCookies(res);
  return res.status(204).send();
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });
});
