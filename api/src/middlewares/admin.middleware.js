// api/src/middlewares/admin.middleware.js
import { prisma } from "../config/prisma.js";
export async function adminMiddleware(req, res, next) {
  try {
    const user = req.user?.id && await prisma.user.findUnique({ where: { id: req.user.id }, select: { isAdmin: true, role: true } });
    if (!user || (!user.isAdmin && user.role !== "ADMINISTRATEUR")) return res.status(403).json({ message: "Forbidden (admin only)" });
    return next();
  } catch (error) { next(error); }
}
