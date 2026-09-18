import { adminPremiumService } from "./admin.premium.service.js";
export const adminPremiumController = {
  async list(req, res) { res.set("Cache-Control", "no-store").json(await adminPremiumService.list(req.query)); },
  async create(req, res) { res.status(201).json(await adminPremiumService.create(req.body)); },
  async update(req, res) { res.json(await adminPremiumService.disable(req.params.id, req.body)); },
};
