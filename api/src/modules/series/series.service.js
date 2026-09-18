// api/src/modules/series/series.service.js
import { prisma } from "../../config/prisma.js";

export const seriesService = {
  async list() {
    const series = await prisma.series.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverUrl: true,
        createdAt: true,
        _count: { select: { meditations: true } },
      },
    });

    return { series };
  },

  async detail(slug) {
    const series = await prisma.series.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverUrl: true,
        meditations: {
          where: { isPublished: true },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            title: true,
            slug: true,
            imageUrl: true,
            audioDuration: true,
            isPremium: true,
            createdAt: true,
          },
        },
      },
    });

    if (!series) {
      const err = new Error("Series not found");
      err.statusCode = 404;
      throw err;
    }

    return { series };
  },
};
