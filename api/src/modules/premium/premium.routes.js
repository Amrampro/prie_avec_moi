import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/async.handler.js";
import { premiumController } from "./premium.controller.js";

export const premiumRoutes = Router();
premiumRoutes.use(authMiddleware);
// Bound guessing attempts per account, with bounded memory and automatic expiry.
const attempts = new Map();
premiumRoutes.post("/activate", (req, res, next) => {
  const now = Date.now();
  for (const [id, entry] of attempts) if (entry.until <= now) attempts.delete(id);
  const entry = attempts.get(req.user.id) ?? { count: 0, until: now + 15 * 60 * 1000 };
  if (entry.count >= 10 || (!attempts.has(req.user.id) && attempts.size >= 10000)) {
    return res.status(429).json({ code: "TOO_MANY_ATTEMPTS", message: "Trop de tentatives. Réessayez dans 15 minutes." });
  }
  entry.count++;
  attempts.set(req.user.id, entry);
  next();
}, asyncHandler(premiumController.activate));
premiumRoutes.get("/status", asyncHandler(premiumController.status));
