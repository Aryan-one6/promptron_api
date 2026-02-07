import jwt from "jsonwebtoken";
import { env } from "../config";
export type UserRole = "USER" | "ADMIN";

export type JwtPayload = {
  sub: string;
  role: UserRole;
};

export function createAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "15m" });
}

export function createRefreshToken(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}

export function setAuthCookies(res: import("express").Response, access: string, refresh: string) {
  const isProd = env.NODE_ENV === "production";
  res.cookie("promptly_access", access, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 1000 * 60 * 15
  });
  res.cookie("promptly_refresh", refresh, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 1000 * 60 * 60 * 24 * 7
  });
}

export function clearAuthCookies(res: import("express").Response) {
  res.clearCookie("promptly_access");
  res.clearCookie("promptly_refresh");
}
