import { authService } from "./auth.service.js";

export const authController = {
  async signup(req, res) {
    const result = await authService.signup(req.body);
    return res.status(201).json(result);
  },

  async signin(req, res) {
    const result = await authService.signin(req.body);
    return res.json(result);
  },
};
