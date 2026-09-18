// api/src/modules/admin-users/admin.users.controller.js
import { adminUsersService } from "./admin.users.service.js";

export const adminUsersController = {
  async list(req, res) {
    const { limit, cursorId, cursorCreatedAt, q } = req.query;

    const result = await adminUsersService.list({
      limit,
      cursorId,
      cursorCreatedAt,
      q,
    });

    return res.json(result);
  },

  async detail(req, res) {
    const result = await adminUsersService.detail(req.params.id);
    return res.json(result);
  },

  async updateRole(req, res) {
    const result = await adminUsersService.updateRole(req.params.id, req.body, {
      actorUserId: req.user?.id,
    });
    return res.json(result);
  },

  async remove(req, res) {
    const result = await adminUsersService.remove(req.params.id, {
      actorUserId: req.user?.id,
    });
    return res.json(result);
  },
};
