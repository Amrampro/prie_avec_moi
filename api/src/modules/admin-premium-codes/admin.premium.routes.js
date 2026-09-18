import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/async.handler.js";
import { prisma } from "../../config/prisma.js";
import { adminPremiumController } from "./admin.premium.controller.js";

export const adminPremiumRoutes = Router();
adminPremiumRoutes.use(authMiddleware, asyncHandler(async (req, res, next) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { isAdmin: true } });
  if (!user?.isAdmin) return res.status(403).json({ message: "Forbidden (admin only)" });
  next();
}));
adminPremiumRoutes.get("/", asyncHandler(adminPremiumController.list));
adminPremiumRoutes.post("/", asyncHandler(adminPremiumController.create));
adminPremiumRoutes.patch("/:id", asyncHandler(adminPremiumController.update));
