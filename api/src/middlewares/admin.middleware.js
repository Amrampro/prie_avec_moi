// api/src/middlewares/admin.middleware.js
export function adminMiddleware(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Forbidden (admin only)" });
  }
  return next();
}
