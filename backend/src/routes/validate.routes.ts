import * as validateController from "../controllers/validate.controller.js";

import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();
router.post("/", asyncHandler(validateController.validateCaption));
export default router;
