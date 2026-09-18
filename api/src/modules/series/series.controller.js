// api/src/modules/series/series.controller.js
import { seriesService } from "./series.service.js";

export const seriesController = {
  async list(req, res) {
    const result = await seriesService.list();
    return res.json(result);
  },

  async detail(req, res) {
    const result = await seriesService.detail(req.params.slug);
    return res.json(result);
  },
};
