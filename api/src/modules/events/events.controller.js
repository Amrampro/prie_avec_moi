import { eventsService } from "./events.service.js";

export const eventsController = {
  async list(req, res) {
    const result = await eventsService.list();
    return res.json(result);
  },

  async home(req, res) {
    const result = await eventsService.home();
    return res.json(result);
  },

  async get(req, res) {
    const result = await eventsService.get(req.params.id);
    return res.json(result);
  },
};
