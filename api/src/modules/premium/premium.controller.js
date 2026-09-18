import { premiumService } from "./premium.service.js";
export const premiumController = {
  async status(req, res) { res.set("Cache-Control", "no-store").json(await premiumService.status(req.user.id)); },
  async activate(req, res) { res.set("Cache-Control", "no-store").json(await premiumService.activate(req.user.id, req.body)); },
};
