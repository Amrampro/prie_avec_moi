import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/async.handler.js";
import { favoriteController } from "./favorite.controller.js";

export const favoriteRoutes = Router();

favoriteRoutes.get("/", authMiddleware, asyncHandler(favoriteController.list));
favoriteRoutes.post("/:meditationId", authMiddleware, asyncHandler(favoriteController.add));
favoriteRoutes.delete("/:meditationId", authMiddleware, asyncHandler(favoriteController.remove));
