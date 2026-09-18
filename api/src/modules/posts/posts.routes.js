// api/src/modules/posts/posts.routes.js
import { Router } from "express";
import { asyncHandler } from "../../utils/async.handler.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { postsController } from "./posts.controller.js";
import { optionalAuthMiddleware } from "../../middlewares/optional-auth.middleware.js";

export const postsRoutes = Router();

// list feed (published only) — auth optional? (we'll accept both)
// postsRoutes.get("/", asyncHandler(postsController.list));
// postsRoutes.get("/:id", asyncHandler(postsController.detail));

// GET feed + detail => auth optionnelle pour isLikedByMe
postsRoutes.get("/", optionalAuthMiddleware, asyncHandler(postsController.list));
postsRoutes.get("/:id", optionalAuthMiddleware, asyncHandler(postsController.detail));

// like/unlike requires auth
postsRoutes.post("/:id/like", authMiddleware, asyncHandler(postsController.like));
postsRoutes.post("/:id/unlike", authMiddleware, asyncHandler(postsController.unlike));

// comments
postsRoutes.get("/:id/comments", asyncHandler(postsController.listComments));
postsRoutes.post("/:id/comments", authMiddleware, asyncHandler(postsController.createComment));
