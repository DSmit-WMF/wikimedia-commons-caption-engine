import * as languagesController from "../controllers/languages.controller.js";

import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();
router.get("/", asyncHandler(languagesController.getSuggested));
router.get("/all", asyncHandler(languagesController.getAll));
export default router;
