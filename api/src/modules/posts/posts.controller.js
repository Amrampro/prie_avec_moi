// api/src/modules/posts/posts.controller.js
import { postsService } from "./posts.service.js";

export const postsController = {
  async list(req, res) {
    const userId = req.user?.id ?? null;
    const { limit, cursorId, cursorCreatedAt } = req.query;

    const result = await postsService.list({
      userId,
      limit,
      cursorId,
      cursorCreatedAt,
    });

    return res.json(result);
  },

  async detail(req, res) {
    const userId = req.user?.id ?? null; // auth optional
    const result = await postsService.detail(req.params.id, { userId });
    return res.json(result);
  },

  async like(req, res) {
    const result = await postsService.like(req.params.id, req.user?.id);
    return res.json(result);
  },

  async unlike(req, res) {
    const result = await postsService.unlike(req.params.id, req.user?.id);
    return res.json(result);
  },

  async listComments(req, res) {
    const result = await postsService.listComments(req.params.id);
    return res.json(result);
  },

  async createComment(req, res) {
    const result = await postsService.createComment(
      req.params.id,
      req.user?.id,
      req.body,
    );
    return res.status(201).json(result);
  },
};
