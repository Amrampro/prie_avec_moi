// api/src/app.js
import express from "express";
import { premiumRoutes } from "./modules/premium/premium.routes.js";
import { adminPremiumRoutes } from "./modules/admin-premium-codes/admin.premium.routes.js";
import { optionalAuthMiddleware } from "./middlewares/optional-auth.middleware.js";
import { asyncHandler } from "./utils/async.handler.js";
import { protectUploadedAudio } from "./modules/meditations/meditation.audio.js";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import path from "path";
import { fileURLToPath } from "url";
import { uploadRoutes } from "./modules/uploads/uploads.routes.js";

import { authRoutes } from "./modules/auth/auth.routes.js";
import { accountRoutes } from "./modules/account/account.routes.js";
import { seriesRoutes } from "./modules/series/series.routes.js";
import { meditationRoutes } from "./modules/meditations/meditation.routes.js";
import { favoriteRoutes } from "./modules/favorites/favorite.routes.js";
import { eventsRoutes } from "./modules/events/events.routes.js";
import { postsRoutes } from "./modules/posts/posts.routes.js";

import { adminSeriesRoutes } from "./modules/admin-series/admin.series.routes.js";
import { adminMeditationRoutes } from "./modules/admin-meditations/admin.meditation.routes.js";
import { adminEventsRoutes } from "./modules/admin-events/admin.events.routes.js";
import { adminPostsRoutes } from "./modules/admin-posts/admin.posts.routes.js";
import { adminUsersRoutes } from "./modules/admin-users/admin.users.routes.js";
import { myPostsRoutes } from "./modules/my-posts/my.posts.routes.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(helmet());
  app.use(morgan("dev"));
  app.use(express.json({ limit: "10mb" }));

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  app.use("/uploads", optionalAuthMiddleware, asyncHandler(protectUploadedAudio), express.static(path.join(__dirname, "../uploads"), { cacheControl: false }));
  app.use("/api/admin/uploads", uploadRoutes);

  app.get("/api/health", (req, res) => res.json({ ok: true }));

  app.use("/api/premium", premiumRoutes);
  app.use("/api/admin/premium-codes", adminPremiumRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/account", accountRoutes);
  app.use("/api/series", seriesRoutes);
  app.use("/api/meditations", meditationRoutes);
  app.use("/api/favorites", favoriteRoutes);
  app.use("/api/events", eventsRoutes);
  app.use("/api/posts", postsRoutes);
  app.use("/api/my-posts", myPostsRoutes);
  
  app.use("/api/admin/series", adminSeriesRoutes);
  app.use("/api/admin/meditations", adminMeditationRoutes);
  app.use("/api/admin/events", adminEventsRoutes);
  app.use("/api/admin/posts", adminPostsRoutes);
  app.use("/api/admin/users", adminUsersRoutes);

  app.use(errorMiddleware);

  return app;
}
