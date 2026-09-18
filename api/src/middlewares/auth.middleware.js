// api/src/middlewares/auth.middleware.js
import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    const token = header.slice(7).trim();
    if (!token) return res.status(401).json({ message: "Unauthenticated" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Supporte plusieurs formats de payload
    const userId = payload.userId || payload.id || payload.sub;

    if (!userId) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    req.user = { id: userId, ...payload };
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthenticated" });
  }
}
