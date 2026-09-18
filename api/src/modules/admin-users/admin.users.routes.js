// api/src/modules/admin-users/admin.users.routes.js
import { Router } from "express";
import { asyncHandler } from "../../utils/async.handler.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { adminMiddleware } from "../../middlewares/admin.middleware.js";
import { adminUsersController } from "./admin.users.controller.js";

export const adminUsersRoutes = Router();

// Tout est admin-only (section admin)
adminUsersRoutes.get("/", authMiddleware, adminMiddleware, asyncHandler(adminUsersController.list));
adminUsersRoutes.get("/:id", authMiddleware, adminMiddleware, asyncHandler(adminUsersController.detail));

// changer rôle
adminUsersRoutes.patch("/:id/role", authMiddleware, adminMiddleware, asyncHandler(adminUsersController.updateRole));

// supprimer user
adminUsersRoutes.delete("/:id", authMiddleware, adminMiddleware, asyncHandler(adminUsersController.remove));
