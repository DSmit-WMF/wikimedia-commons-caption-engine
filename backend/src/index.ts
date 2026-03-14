import { config } from "./config.js";
import cors from "cors";
import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import routes from "./api/routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));
app.use("/api", routes);

// OpenAPI spec + Swagger UI (dev only; not mounted in production)
if (process.env.NODE_ENV !== "production") {
  const specPath =
    process.env.OPENAPI_SPEC_PATH ||
    path.resolve(path.join(__dirname, "..", "..", "openapi.yaml"));
  app.get("/openapi.yaml", (_req, res) => res.sendFile(specPath));
  const swaggerUi = (await import("swagger-ui-express")).default;
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(null, { swaggerOptions: { url: "/openapi.yaml" } }),
  );
}

app.listen(config.port, () => {
  console.log(
    `Caption engine backend listening on http://localhost:${config.port}`,
  );
  if (process.env.NODE_ENV !== "production") {
    console.log(`  API docs: http://localhost:${config.port}/api-docs`);
  }
});
