// api/src/modules/admin-posts/admin.posts.controller.js
import { adminPostsService } from "./admin.posts.service.js";

export const adminPostsController = {
  async list(req, res) {
    const { limit, cursorId, cursorCreatedAt } = req.query;

    const result = await adminPostsService.list({
      limit,
      cursorId,
      cursorCreatedAt,
    });

    return res.json(result);
  },

  async get(req, res) {
    const result = await adminPostsService.get(req.params.id);
    return res.json(result);
  },

  async create(req, res) {
    const result = await adminPostsService.create(req.user.id, req.body);
    return res.status(201).json(result);
  },

  async update(req, res) {
    const result = await adminPostsService.update(req.params.id, req.body);
    return res.json(result);
  },

  async remove(req, res) {
    const result = await adminPostsService.remove(req.params.id);
    return res.json(result);
  },

  async publish(req, res) {
    const result = await adminPostsService.setPublished(req.params.id, true);
    return res.json(result);
  },

  async unpublish(req, res) {
    const result = await adminPostsService.setPublished(req.params.id, false);
    return res.json(result);
  },
};