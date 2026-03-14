import apiRouter from "./routes/index.js";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";
import express from "express";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp(): express.Express {
  const app = express();
  app.use(cors({ origin: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use("/api", apiRouter);

  if (process.env.NODE_ENV !== "production") {
    const specPath =
      process.env.OPENAPI_SPEC_PATH ??
      path.resolve(path.join(__dirname, "..", "..", "openapi.yaml"));
    app.get("/openapi.yaml", (_req, res) => res.sendFile(specPath));
    // Swagger UI is mounted asynchronously in index.ts to avoid loading swagger-ui-express in production
  }

  app.use(errorHandler);
  return app;
}
