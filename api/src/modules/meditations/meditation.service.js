// api/src/modules/meditations/meditation.service.js
import { assertMeditationAccess, isUserPremium, meditationPreview } from "../premium/premium.logic.js";
import { prisma } from "../../config/prisma.js";

export const meditationService = {
  async daily(userId) {
    const meditation = await prisma.meditation.findFirst({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        isPremium: true,
        title: true,
        slug: true,
        imageUrl: true,
        bodyText: true,
        footerText: true,
        audioUrl: true,
        audioDuration: true,
        seriesId: true,
      },
    });

    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
    if (meditation?.isPremium && !isUserPremium(user)) return { meditation: { ...meditationPreview(meditation), isLocked: true } };
    return { meditation };

  },

  async detail(slug, userId) {
    const meditation = await prisma.meditation.findUnique({
      where: { slug, isPublished: true },
      select: {
        id: true,
        isPremium: true,
        title: true,
        slug: true,
        imageUrl: true,
        bodyText: true,
        footerText: true,
        audioUrl: true,
        audioDuration: true,
        series: { select: { id: true, title: true, slug: true } },
        createdAt: true,
      },
    });

    if (!meditation) {
      const err = new Error("Meditation not found");
      err.statusCode = 404;
      throw err;
    }

    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
    assertMeditationAccess(meditation, user);
    return { meditation };
  },

  // ✅ NEW: list meditations without series (seriesId = null)
  async standaloneList({ limit = 20, cursorId = null, cursorCreatedAt = null }) {
    const take = Math.max(1, Math.min(Number(limit) || 20, 50));

    const where = {
      isPublished: true,
      seriesId: null,
    };

    // pagination stable (createdAt desc, id desc)
    if (cursorId && cursorCreatedAt) {
      const cursorDate = new Date(cursorCreatedAt);
      where.OR = [
        { createdAt: { lt: cursorDate } },
        { createdAt: cursorDate, id: { lt: cursorId } },
      ];
    }

    const meditations = await prisma.meditation.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      select: {
        id: true,
        isPremium: true,
        title: true,
        slug: true,
        imageUrl: true,
        footerText: true,
        audioUrl: true,
        audioDuration: true,
        createdAt: true,
      },
    });

    const last = meditations[meditations.length - 1] ?? null;
    const nextCursor = last
      ? { cursorId: last.id, cursorCreatedAt: last.createdAt }
      : null;

    return { meditations: meditations.map(m => m.isPremium ? meditationPreview(m) : m), nextCursor };
  },
};