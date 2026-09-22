// api/src/app.js

import express from "express";
import { prayerRoutes } from "./modules/prayer/prayer.routes.js";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { premiumRoutes } from "./modules/premium/premium.routes.js";
import { adminPremiumRoutes } from "./modules/admin-premium-codes/admin.premium.routes.js";

import { optionalAuthMiddleware } from "./middlewares/optional-auth.middleware.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

import { asyncHandler } from "./utils/async.handler.js";
import { protectUploadedAudio } from "./modules/meditations/meditation.audio.js";

import { uploadRoutes } from "./modules/uploads/uploads.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { accountRoutes } from "./modules/account/account.routes.js";
import { seriesRoutes } from "./modules/series/series.routes.js";
import { meditationRoutes } from "./modules/meditations/meditation.routes.js";
import { favoriteRoutes } from "./modules/favorites/favorite.routes.js";
import { eventsRoutes } from "./modules/events/events.routes.js";
import { postsRoutes } from "./modules/posts/posts.routes.js";
import { myPostsRoutes } from "./modules/my-posts/my.posts.routes.js";

import { adminSeriesRoutes } from "./modules/admin-series/admin.series.routes.js";
import { adminMeditationRoutes } from "./modules/admin-meditations/admin.meditation.routes.js";
import { adminEventsRoutes } from "./modules/admin-events/admin.events.routes.js";
import { adminPostsRoutes } from "./modules/admin-posts/admin.posts.routes.js";
import { adminUsersRoutes } from "./modules/admin-users/admin.users.routes.js";

export function createApp() {
  const app = express();

  // -------------------------------------------------------
  // Paths
  // -------------------------------------------------------

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // api/src -> api/dist
  const distPath = path.resolve(__dirname, "../dist");

  // api/src -> api/uploads
  const uploadsPath = path.resolve(__dirname, "../uploads");

  // -------------------------------------------------------
  // Global middlewares
  // -------------------------------------------------------

  app.use(cors());

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    })
  );

  app.use(morgan("dev"));

  app.use(
    express.json({
      limit: "10mb",
    })
  );

  app.use(
    express.urlencoded({
      extended: true,
      limit: "10mb",
    })
  );

  // -------------------------------------------------------
  // Uploaded files
  // -------------------------------------------------------

  app.use(
    "/uploads",
    optionalAuthMiddleware,
    asyncHandler(protectUploadedAudio),
    express.static(uploadsPath, {
      cacheControl: false,
    })
  );

  // -------------------------------------------------------
  // Health check
  // -------------------------------------------------------

  app.get("/api/health", (req, res) => {
    res.status(200).json({
      ok: true,
    });
  });

  // -------------------------------------------------------
  // Public / authenticated API
  // -------------------------------------------------------

  app.use("/api/premium", premiumRoutes);
  app.use("/api/prayer", prayerRoutes);

  app.use("/api/auth", authRoutes);

  app.use("/api/account", accountRoutes);

  app.use("/api/series", seriesRoutes);

  app.use("/api/meditations", meditationRoutes);

  app.use("/api/favorites", favoriteRoutes);

  app.use("/api/events", eventsRoutes);

  app.use("/api/posts", postsRoutes);

  app.use("/api/my-posts", myPostsRoutes);

  // -------------------------------------------------------
  // Admin API
  // -------------------------------------------------------

  app.use("/api/admin/uploads", uploadRoutes);

  app.use("/api/admin/premium-codes", adminPremiumRoutes);

  app.use("/api/admin/series", adminSeriesRoutes);

  app.use("/api/admin/meditations", adminMeditationRoutes);

  app.use("/api/admin/events", adminEventsRoutes);

  app.use("/api/admin/posts", adminPostsRoutes);

  app.use("/api/admin/users", adminUsersRoutes);

  // -------------------------------------------------------
  // Unknown API route
  // IMPORTANT:
  // Do this BEFORE the frontend fallback.
  // Otherwise /api/xxx could return index.html.
  // -------------------------------------------------------

  app.use("/api", (req, res) => {
    res.status(404).json({
      message: "API route not found",
      method: req.method,
      path: req.originalUrl,
    });
  });

  // -------------------------------------------------------
  // Frontend / static site
  // -------------------------------------------------------

  app.use(
    express.static(distPath, {
      index: "index.html",
    })
  );

  /*
   * Frontend fallback.
   *
   * Any GET request that is not /api/... and does not correspond
   * to a static file returns dist/index.html.
   *
   * Using middleware instead of app.get("*") also avoids
   * wildcard/path-to-regexp issues depending on Express version.
   */
  app.use((req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }

    return res.sendFile(path.join(distPath, "index.html"));
  });

  // -------------------------------------------------------
  // Error middleware MUST remain last
  // -------------------------------------------------------

  app.use(errorMiddleware);

  return app;
}
