import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { adminMiddleware } from "../../middlewares/admin.middleware.js";
import { asyncHandler } from "../../utils/async.handler.js";
import { adminMeditationController } from "./admin.meditation.controller.js";

export const adminMeditationRoutes = Router();

adminMeditationRoutes.use(authMiddleware, adminMiddleware);

adminMeditationRoutes.get("/", asyncHandler(adminMeditationController.list));
adminMeditationRoutes.get("/:id", asyncHandler(adminMeditationController.get));

adminMeditationRoutes.post("/", asyncHandler(adminMeditationController.create));
adminMeditationRoutes.patch("/:id", asyncHandler(adminMeditationController.update));
adminMeditationRoutes.delete("/:id", asyncHandler(adminMeditationController.remove));

adminMeditationRoutes.post("/:id/publish", asyncHandler(adminMeditationController.publish));
adminMeditationRoutes.post("/:id/unpublish", asyncHandler(adminMeditationController.unpublish));
