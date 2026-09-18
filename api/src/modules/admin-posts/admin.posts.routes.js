// api/src/modules/admin-posts/admin.posts.routes.js
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { adminMiddleware } from "../../middlewares/admin.middleware.js";
import { asyncHandler } from "../../utils/async.handler.js";
import { adminPostsController } from "./admin.posts.controller.js";

export const adminPostsRoutes = Router();

adminPostsRoutes.use(authMiddleware, adminMiddleware);

adminPostsRoutes.get("/", asyncHandler(adminPostsController.list));
adminPostsRoutes.get("/:id", asyncHandler(adminPostsController.get));

adminPostsRoutes.post("/", asyncHandler(adminPostsController.create));
adminPostsRoutes.patch("/:id", asyncHandler(adminPostsController.update));
adminPostsRoutes.delete("/:id", asyncHandler(adminPostsController.remove));

adminPostsRoutes.post("/:id/publish", asyncHandler(adminPostsController.publish));
adminPostsRoutes.post("/:id/unpublish", asyncHandler(adminPostsController.unpublish));
