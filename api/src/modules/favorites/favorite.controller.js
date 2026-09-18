import { favoriteService } from "./favorite.service.js";

export const favoriteController = {
  async list(req, res) {
    const result = await favoriteService.list(req.user.userId);
    return res.json(result);
  },

  async add(req, res) {
    const result = await favoriteService.add(req.user.userId, req.params.meditationId);
    return res.status(201).json(result);
  },

  async remove(req, res) {
    const result = await favoriteService.remove(req.user.userId, req.params.meditationId);
    return res.json(result);
  },
};
