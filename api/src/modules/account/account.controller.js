// api/src/modules/account/account.controller.js
import { accountService } from "./account.service.js";

export const accountController = {
  async me(req, res) {
    const result = await accountService.me(req.user?.id);
    return res.json(result);
  },

  async update(req, res) {
    const result = await accountService.update(req.user?.id, req.body);
    return res.json(result);
  },

  async remove(req, res) {
    const result = await accountService.remove(req.user?.id, req.body);
    return res.json(result);
  },
};
