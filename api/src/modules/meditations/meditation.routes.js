// api/src/modules/meditations/meditation.routes.js
import { optionalAuthMiddleware } from "../../middlewares/optional-auth.middleware.js";
import { Router } from "express";
import { asyncHandler } from "../../utils/async.handler.js";
import { meditationController } from "./meditation.controller.js";

export const meditationRoutes = Router();
meditationRoutes.use(optionalAuthMiddleware);

meditationRoutes.get("/daily", asyncHandler(meditationController.daily));
meditationRoutes.get("/:slug/audio", asyncHandler(meditationController.audio));

// ✅ NEW (place before "/:slug")
meditationRoutes.get("/standalone", asyncHandler(meditationController.standaloneList));

meditationRoutes.get("/:slug", asyncHandler(meditationController.detail));
