// api/src/modules/my-posts/my.posts.routes.js
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/async.handler.js";
import { myPostsController } from "./my.posts.controller.js";

export const myPostsRoutes = Router();

// ✅ connecté uniquement
myPostsRoutes.use(authMiddleware);

myPostsRoutes.get("/", asyncHandler(myPostsController.list));
myPostsRoutes.get("/:id", asyncHandler(myPostsController.get));

myPostsRoutes.post("/", asyncHandler(myPostsController.create));
myPostsRoutes.patch("/:id", asyncHandler(myPostsController.update));
myPostsRoutes.delete("/:id", asyncHandler(myPostsController.remove));

myPostsRoutes.post("/:id/publish", asyncHandler(myPostsController.publish));
myPostsRoutes.post("/:id/unpublish", asyncHandler(myPostsController.unpublish));