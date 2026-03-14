import { config } from "./config.js";
import { createApp } from "./app.js";

async function main(): Promise<void> {
  const app = createApp();

  if (process.env.NODE_ENV !== "production") {
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
}

main();
