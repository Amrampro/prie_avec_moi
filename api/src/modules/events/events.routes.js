import { Router } from "express";
import { asyncHandler } from "../../utils/async.handler.js";
import { eventsController } from "./events.controller.js";

export const eventsRoutes = Router();

eventsRoutes.get("/", asyncHandler(eventsController.list));
eventsRoutes.get("/home", asyncHandler(eventsController.home));
eventsRoutes.get("/:id", asyncHandler(eventsController.get));
