import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { codeSchema } from "../premium/premium.service.js";
import { premiumError } from "../premium/premium.logic.js";

const createSchema = z.object({
  code: codeSchema.optional(),
  duration: z.number().int().min(1).max(3650),
  durationUnit: z.enum(["DAYS", "MONTHS", "YEARS"]).default("DAYS"),
  expiresAt: z.string().datetime({ offset: true }).nullable().optional(),
}).refine(d => d.duration <= ({ DAYS: 3650, MONTHS: 120, YEARS: 10 })[d.durationUnit], "Durée maximale : 10 ans.");

export const adminPremiumService = {
  async list(query = {}) {
    const page = z.coerce.number().int().min(1).max(1000000).default(1).parse(query.page);
    const now = new Date();
    const codes = await prisma.premiumCode.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 50, take: 51,
      include: { usedBy: { select: { id: true, fullName: true, email: true } }, activation: true },
    });
    return { codes: codes.slice(0, 50).map(c => ({ ...c, status: c.status === "AVAILABLE" && c.expiresAt && c.expiresAt <= now ? "EXPIRED" : c.status })), nextPage: codes.length > 50 ? page + 1 : null };
  },
  async create(payload) {
    const data = createSchema.parse(payload);
    if (data.expiresAt && new Date(data.expiresAt) <= new Date()) throw premiumError("INVALID_EXPIRY", "La date d’expiration doit être future.");
    // 128 random bits; manual codes use the same normalized unique key.
    const code = data.code ?? `PRIE-${randomBytes(16).toString("hex").toUpperCase().match(/.{4}/g).join("-")}`;
    try {
      return { code: await prisma.premiumCode.create({ data: { ...data, code, expiresAt: data.expiresAt ? new Date(data.expiresAt) : null } }) };
    } catch (error) {
      if (error.code === "P2002") throw premiumError("CODE_EXISTS", "Ce code existe déjà.", 409);
      throw error;
    }
  },
  async disable(id, payload) {
    z.object({ status: z.literal("DISABLED") }).strict().parse(payload);
    const result = await prisma.premiumCode.updateMany({ where: { id, status: "AVAILABLE", usedAt: null }, data: { status: "DISABLED" } });
    if (!result.count) throw premiumError("CODE_UNAVAILABLE", "Ce code est introuvable ou n’est plus disponible.", 409);
    return { code: await prisma.premiumCode.findUnique({ where: { id } }) };
  },
};
