import { Router } from "express";
import commonsRoutes from "./commons.routes.js";
import healthRoutes from "./health.routes.js";
import languagesRoutes from "./languages.routes.js";
import translateRoutes from "./translate.routes.js";
import validateRoutes from "./validate.routes.js";

const apiRouter = Router();

apiRouter.use("/health", healthRoutes);
apiRouter.use("/languages", languagesRoutes);
apiRouter.use("/translate-captions", translateRoutes);
apiRouter.use("/validate-caption", validateRoutes);
apiRouter.use("/commons", commonsRoutes);

export default apiRouter;
