// api/src/modules/my-posts/my.posts.controller.js
import { myPostsService } from "./my.posts.service.js";

export const myPostsController = {
  async list(req, res) {
    const result = await myPostsService.list(req.user.id);
    return res.json(result);
  },

  async get(req, res) {
    const result = await myPostsService.get(req.user.id, req.params.id);
    return res.json(result);
  },

  async create(req, res) {
    const result = await myPostsService.create(req.user.id, req.body);
    return res.status(201).json(result);
  },

  async update(req, res) {
    const result = await myPostsService.update(req.user.id, req.params.id, req.body);
    return res.json(result);
  },

  async remove(req, res) {
    const result = await myPostsService.remove(req.user.id, req.params.id);
    return res.json(result);
  },

  async publish(req, res) {
    const result = await myPostsService.setPublished(req.user.id, req.params.id, true);
    return res.json(result);
  },

  async unpublish(req, res) {
    const result = await myPostsService.setPublished(req.user.id, req.params.id, false);
    return res.json(result);
  },
};