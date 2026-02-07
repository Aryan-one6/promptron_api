import type { NextFunction, Request, Response } from "express";
import { createAccessToken, verifyAccessToken, verifyRefreshToken } from "../lib/auth";
import { setAuthCookies } from "../lib/auth";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const access = req.cookies?.promptly_access as string | undefined;
  const refresh = req.cookies?.promptly_refresh as string | undefined;

  if (access) {
    try {
      req.user = verifyAccessToken(access);
      return next();
    } catch {
      // fall through to refresh
    }
  }

  if (refresh) {
    try {
      const payload = verifyRefreshToken(refresh);
      const newAccess = createAccessToken(payload);
      setAuthCookies(res, newAccess, refresh);
      req.user = payload;
      return next();
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }
  }

  return res.status(401).json({ message: "Unauthorized" });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Forbidden" });
  }
  return next();
}
