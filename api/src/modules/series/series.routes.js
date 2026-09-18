// api/src/modules/series/series.routes.js
import { Router } from "express";
import { asyncHandler } from "../../utils/async.handler.js";
import { seriesController } from "./series.controller.js";

export const seriesRoutes = Router();

seriesRoutes.get("/", asyncHandler(seriesController.list));
seriesRoutes.get("/:slug", asyncHandler(seriesController.detail));
