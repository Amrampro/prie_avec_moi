import { Router } from "express";
import { asyncHandler } from "../../utils/async.handler.js";
import { authController } from "./auth.controller.js";

export const authRoutes = Router();

authRoutes.post("/signup", asyncHandler(authController.signup));
authRoutes.post("/signin", asyncHandler(authController.signin));
