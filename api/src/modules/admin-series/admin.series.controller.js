// api/src/modules/admin-series/admin.series.controller.js
import { adminSeriesService } from "./admin.series.service.js";

export const adminSeriesController = {
  async list(req, res) {
    const result = await adminSeriesService.list();
    return res.json(result);
  },

  async get(req, res) {
    const result = await adminSeriesService.get(req.params.id);
    return res.json(result);
  },

  async create(req, res) {
    const result = await adminSeriesService.create(req.body);
    return res.status(201).json(result);
  },

  async update(req, res) {
    const result = await adminSeriesService.update(req.params.id, req.body);
    return res.json(result);
  },

  async remove(req, res) {
    const result = await adminSeriesService.remove(req.params.id);
    return res.json(result);
  },

  async publish(req, res) {
    const result = await adminSeriesService.setPublished(req.params.id, true);
    return res.json(result);
  },

  async unpublish(req, res) {
    const result = await adminSeriesService.setPublished(req.params.id, false);
    return res.json(result);
  },
};
