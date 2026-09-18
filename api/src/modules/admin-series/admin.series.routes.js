// api/src/modules/admin-series/admin.series.routes.js
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { adminMiddleware } from "../../middlewares/admin.middleware.js";
import { asyncHandler } from "../../utils/async.handler.js";
import { adminSeriesController } from "./admin.series.controller.js";

export const adminSeriesRoutes = Router();

adminSeriesRoutes.use(authMiddleware, adminMiddleware);

adminSeriesRoutes.get("/", asyncHandler(adminSeriesController.list));
adminSeriesRoutes.get("/:id", asyncHandler(adminSeriesController.get));

adminSeriesRoutes.post("/", asyncHandler(adminSeriesController.create));
adminSeriesRoutes.patch("/:id", asyncHandler(adminSeriesController.update));
adminSeriesRoutes.delete("/:id", asyncHandler(adminSeriesController.remove));

adminSeriesRoutes.post("/:id/publish", asyncHandler(adminSeriesController.publish));
adminSeriesRoutes.post("/:id/unpublish", asyncHandler(adminSeriesController.unpublish));
