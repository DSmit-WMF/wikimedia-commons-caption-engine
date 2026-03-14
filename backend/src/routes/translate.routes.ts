import * as translateController from "../controllers/translate.controller.js";

import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();
router.post("/", asyncHandler(translateController.translateCaptions));
export default router;
