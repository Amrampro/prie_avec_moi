// api/src/modules/account/account.service.js
import { z } from "zod";
import bcrypt from "bcryptjs";
import { premiumStatus } from "../premium/premium.logic.js";
import { prisma } from "../../config/prisma.js";
import { removeProofFiles } from "../uploads/uploads.routes.js";

const updateSchema = z
  .object({
    fullName: z.string().min(2).optional(),
    email: z.string().email().optional(),
    avatarUrl: z.string().url().optional().nullable(),

    // change password (optional)
    currentPassword: z.string().min(4).optional(),
    newPassword: z.string().min(6).optional(),
  })
  .refine(
    (d) => {
      const wants = Boolean(d.currentPassword || d.newPassword);
      if (!wants) return true;
      return Boolean(d.currentPassword && d.newPassword);
    },
    { message: "currentPassword and newPassword are required to change password" }
  );

const deleteSchema = z.object({
  currentPassword: z.string().min(4),
});

function requireAuthUserId(userId) {
  if (!userId) {
    const err = new Error("Unauthenticated");
    err.statusCode = 401;
    throw err;
  }
  return userId;
}

export const accountService = {
  async me(userId) {
    userId = requireAuthUserId(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        premiumStartAt: true, premiumEndAt: true, isAdmin: true, role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    return { user: { ...user, ...premiumStatus(user) } };
  },

  async update(userId, payload) {
    userId = requireAuthUserId(userId);
    const data = updateSchema.parse(payload);

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, email: true, passwordHash: true, avatarUrl: true },
    });

    if (!existing) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    // email uniqueness if changed
    if (data.email && data.email.trim().toLowerCase() !== existing.email) {
      const used = await prisma.user.findUnique({
        where: { email: data.email.trim().toLowerCase() },
        select: { id: true },
      });

      if (used) {
        const err = new Error("Email already used");
        err.statusCode = 409;
        throw err;
      }
    }

    // password change
    const wantsPasswordChange = Boolean(data.currentPassword || data.newPassword);
    let nextPasswordHash = undefined;

    if (wantsPasswordChange) {
      const ok = await bcrypt.compare(data.currentPassword, existing.passwordHash);
      if (!ok) {
        const err = new Error("Invalid current password");
        err.statusCode = 401;
        throw err;
      }

      nextPasswordHash = await bcrypt.hash(data.newPassword, 10);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: data.fullName ? data.fullName.trim() : undefined,
        email: data.email ? data.email.trim().toLowerCase() : undefined,
        avatarUrl: data.avatarUrl === undefined ? undefined : data.avatarUrl, // allow null
        passwordHash: nextPasswordHash ?? undefined,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        premiumStartAt: true, premiumEndAt: true, isAdmin: true, role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { user: { ...user, ...premiumStatus(user) } };
  },

  async remove(userId, payload) {
    userId = requireAuthUserId(userId);
    const data = deleteSchema.parse(payload);

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!existing) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    const ok = await bcrypt.compare(data.currentPassword, existing.passwordHash);
    if (!ok) {
      const err = new Error("Invalid current password");
      err.statusCode = 401;
      throw err;
    }

    const proofs = await prisma.contributionProof.findMany({ where: { userId }, select: { filename: true } });
    await prisma.user.delete({ where: { id: userId } });
    await removeProofFiles(proofs.map(p => p.filename));

    return { ok: true };
  },
};
