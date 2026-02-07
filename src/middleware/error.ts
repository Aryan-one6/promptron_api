import type { NextFunction, Request, Response } from "express";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
) {
  if (res.headersSent) {
    return next(err);
  }

  const message = err instanceof Error ? err.message : "Unexpected error";
  const status = err instanceof Error && (err as any).status ? (err as any).status : 500;

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  return res.status(status).json({ message });
}
