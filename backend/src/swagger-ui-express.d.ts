declare module "swagger-ui-express" {
  import { RequestHandler } from "express";
  interface SwaggerUiOptions {
    swaggerOptions?: { url?: string };
  }
  const serve: RequestHandler[];
  function setup(doc: unknown, options?: SwaggerUiOptions): RequestHandler;
  const defaultExport: { serve: typeof serve; setup: typeof setup };
  export default defaultExport;
}
