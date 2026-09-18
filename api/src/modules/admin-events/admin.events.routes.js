// api/src/modules/admin-events/admin.events.routes.js
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { adminMiddleware } from "../../middlewares/admin.middleware.js";
import { asyncHandler } from "../../utils/async.handler.js";
import { adminEventsController } from "./admin.events.controller.js";

export const adminEventsRoutes = Router();

adminEventsRoutes.use(authMiddleware, adminMiddleware);

adminEventsRoutes.get("/", asyncHandler(adminEventsController.list));
adminEventsRoutes.get("/:id", asyncHandler(adminEventsController.get));

adminEventsRoutes.post("/", asyncHandler(adminEventsController.create));
adminEventsRoutes.patch("/:id", asyncHandler(adminEventsController.update));
adminEventsRoutes.delete("/:id", asyncHandler(adminEventsController.remove));

adminEventsRoutes.post("/:id/publish", asyncHandler(adminEventsController.publish));
adminEventsRoutes.post("/:id/unpublish", asyncHandler(adminEventsController.unpublish));
