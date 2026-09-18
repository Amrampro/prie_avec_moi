// api/src/modules/admin-events/admin.events.controller.js
import { adminEventsService } from "./admin.events.service.js";

export const adminEventsController = {
  async list(req, res) {
    const result = await adminEventsService.list();
    return res.json(result);
  },

  async get(req, res) {
    const result = await adminEventsService.get(req.params.id);
    return res.json(result);
  },

  async create(req, res) {
    const result = await adminEventsService.create(req.body);
    return res.status(201).json(result);
  },

  async update(req, res) {
    const result = await adminEventsService.update(req.params.id, req.body);
    return res.json(result);
  },

  async remove(req, res) {
    const result = await adminEventsService.remove(req.params.id);
    return res.json(result);
  },

  async publish(req, res) {
    const result = await adminEventsService.setPublished(req.params.id, true);
    return res.json(result);
  },

  async unpublish(req, res) {
    const result = await adminEventsService.setPublished(req.params.id, false);
    return res.json(result);
  },
};
