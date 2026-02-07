import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { authRouter } from "./routes/auth";
import { catalogRouter } from "./routes/catalog";
import { templatesRouter } from "./routes/templates";
import { generateRouter } from "./routes/generate";
import { savedRouter } from "./routes/saved";
import { adminRouter } from "./routes/admin";
import { meRouter } from "./routes/me";
import { errorHandler } from "./middleware/error";
import { env } from "./config";

export function createApp() {
  const app = express();

  const allowedOrigins = env.CLIENT_URL.split(",").map((origin) => origin.trim()).filter(Boolean);
  const isDev = env.NODE_ENV === "development";
const localhostPattern = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        if (isDev && localhostPattern.test(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());
  app.use(morgan("dev"));

  const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false
  });

  const generateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authLimiter, authRouter);
  app.use("/api", catalogRouter);
  app.use("/api/templates", templatesRouter);
  app.use("/api/generate", generateLimiter, generateRouter);
  app.use("/api", savedRouter);
  app.use("/api", meRouter);
  app.use("/api/admin", adminRouter);

  app.use(errorHandler);

  return app;
}
