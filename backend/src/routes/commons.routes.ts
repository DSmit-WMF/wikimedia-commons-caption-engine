import * as commonsController from "../controllers/commons.controller.js";

import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();
router.get("/file-info", asyncHandler(commonsController.getFileInfo));
router.get("/random-file", asyncHandler(commonsController.getRandomFile));
router.post("/save-captions", asyncHandler(commonsController.saveCaptions));
export default router;
