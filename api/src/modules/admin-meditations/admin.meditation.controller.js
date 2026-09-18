import { adminMeditationService } from "./admin.meditation.service.js";

export const adminMeditationController = {
  async list(req, res) {
    const result = await adminMeditationService.list(req.query);
    return res.json(result);
  },

  async get(req, res) {
    const result = await adminMeditationService.get(req.params.id);
    return res.json(result);
  },

  async create(req, res) {
    const result = await adminMeditationService.create(req.body);
    return res.status(201).json(result);
  },

  async update(req, res) {
    const result = await adminMeditationService.update(req.params.id, req.body);
    return res.json(result);
  },

  async remove(req, res) {
    const result = await adminMeditationService.remove(req.params.id);
    return res.json(result);
  },

  async publish(req, res) {
    const result = await adminMeditationService.setPublished(req.params.id, true);
    return res.json(result);
  },

  async unpublish(req, res) {
    const result = await adminMeditationService.setPublished(req.params.id, false);
    return res.json(result);
  },
};
