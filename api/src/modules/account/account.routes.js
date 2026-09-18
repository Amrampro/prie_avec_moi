// api/src/modules/account/account.routes.js
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/async.handler.js";
import { accountController } from "./account.controller.js";

export const accountRoutes = Router();

accountRoutes.use(authMiddleware);

accountRoutes.get("/me", asyncHandler(accountController.me));
accountRoutes.patch("/", asyncHandler(accountController.update));
accountRoutes.delete("/", asyncHandler(accountController.remove));
