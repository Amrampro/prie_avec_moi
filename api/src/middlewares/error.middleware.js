// api/src/middlewares/error.middleware.js
export function errorMiddleware(err, req, res, next) {
  console.error(err);

  const status = err.statusCode ?? (err.name === "ZodError" ? 400 : 500);
  res.status(status).json({
    message: err.message ?? "Server error",
    ...(err.code && err.statusCode ? { code: err.code } : {}),
  });
}
