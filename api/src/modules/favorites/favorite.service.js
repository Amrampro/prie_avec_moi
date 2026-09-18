import { prisma } from "../../config/prisma.js";

export const favoriteService = {
  async list(userId) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        meditation: {
          select: {
            id: true,
            title: true,
            slug: true,
            imageUrl: true,
            audioDuration: true,
            isPremium: true,
          },
        },
      },
    });

    return { favorites };
  },

  async add(userId, meditationId) {
    const favorite = await prisma.favorite.upsert({
      where: { userId_meditationId: { userId, meditationId } },
      create: { userId, meditationId },
      update: {},
      select: { id: true, createdAt: true },
    });

    return { favorite };
  },

  async remove(userId, meditationId) {
    await prisma.favorite.delete({
      where: { userId_meditationId: { userId, meditationId } },
    });

    return { ok: true };
  },
};
