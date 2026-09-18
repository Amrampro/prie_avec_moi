import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { addDuration, assertAvailable, isUserPremium, premiumError, premiumStatus } from "./premium.logic.js";

export const codeSchema = z.string().trim().toUpperCase().min(8).max(80).regex(/^[A-Z0-9-]+$/);
const activationSchema = z.object({ code: codeSchema });

export function createPremiumService(db) {
  return {
    async status(userId) {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) throw premiumError("UNAUTHENTICATED", "Connectez-vous pour continuer.", 401);
      return premiumStatus(user);
    },
    async activate(userId, payload) {
      const parsed = activationSchema.safeParse(payload);
      if (!parsed.success) throw premiumError("INVALID_CODE", "Code invalide.");
      // Lock the account before the code: also serialize different codes used by one account.
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          return await db.$transaction(async (tx) => {
            const users = await tx.$queryRaw`SELECT id, premiumStartAt, premiumEndAt FROM user WHERE id = ${userId} FOR UPDATE`;
            const user = users[0];
            if (!user) throw premiumError("UNAUTHENTICATED", "Connectez-vous pour continuer.", 401);
            const codes = await tx.$queryRaw`SELECT * FROM premium_code WHERE code = ${parsed.data.code} FOR UPDATE`;
            const code = codes[0];
            const now = new Date();
            assertAvailable(code, now);
            const active = isUserPremium(user, now);
            const premiumEndAt = addDuration(active ? user.premiumEndAt : now, code.duration, code.durationUnit);
            const updated = await tx.user.update({ where: { id: userId }, data: {
              premiumStartAt: active ? user.premiumStartAt ?? now : now, premiumEndAt,
            } });
            await tx.premiumCode.update({ where: { id: code.id }, data: { status: "USED", usedAt: now, usedById: userId } });
            await tx.premiumActivation.create({ data: {
              userId, premiumCodeId: code.id, activatedAt: now,
              previousPremiumEndAt: user.premiumEndAt, newPremiumEndAt: premiumEndAt,
            } });
            return { ...premiumStatus(updated, now), message: "Premium activé." };
          }, { isolationLevel: "ReadCommitted" });
        } catch (error) {
          if (error.code !== "P2034" || attempt === 2) throw error;
        }
      }
    },
  };
}
export const premiumService = createPremiumService(prisma);
