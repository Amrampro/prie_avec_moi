import bcrypt from "bcryptjs";
import { z } from "zod";
import { premiumStatus } from "../premium/premium.logic.js";
import { prisma } from "../../config/prisma.js";
import { signToken } from "../../utils/jwt.js";

const signupSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authService = {
  async signup(payload) {
    const data = signupSchema.parse(payload);

    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) {
      const err = new Error("Email already used");
      err.statusCode = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        passwordHash,
      },
      select: { id: true, fullName: true, email: true, avatarUrl: true, premiumStartAt: true, premiumEndAt: true, isAdmin: true },
    });

    const token = signToken({ userId: user.id, isAdmin: user.isAdmin });

    return { user: { ...user, ...premiumStatus(user) }, token };
  },

  async signin(payload) {
    const data = signinSchema.parse(payload);

    const userDb = await prisma.user.findUnique({ where: { email: data.email } });
    if (!userDb) {
      const err = new Error("Invalid credentials");
      err.statusCode = 401;
      throw err;
    }

    const ok = await bcrypt.compare(data.password, userDb.passwordHash);
    if (!ok) {
      const err = new Error("Invalid credentials");
      err.statusCode = 401;
      throw err;
    }

    const user = {
      id: userDb.id,
      fullName: userDb.fullName,
      email: userDb.email,
      avatarUrl: userDb.avatarUrl,
      isAdmin: userDb.isAdmin,
      ...premiumStatus(userDb),
    };

    const token = signToken({ userId: user.id, isAdmin: user.isAdmin });

    return { user: { ...user, ...premiumStatus(user) }, token };
  },
};
