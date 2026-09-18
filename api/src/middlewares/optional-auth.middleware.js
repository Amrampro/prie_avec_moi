import jwt from "jsonwebtoken";

/**
 * If a valid token is present, req.user is filled.
 * If the token is missing or invalid, the request stays public.
 */
export async function optionalAuthMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) return next();

  try {
    const token = header.slice(7).trim();
    if (!token) return next();

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = payload.userId || payload.id || payload.sub;

    if (userId) {
      req.user = { id: userId, ...payload };
    }

    return next();
  } catch {
    return next();
  }
}
