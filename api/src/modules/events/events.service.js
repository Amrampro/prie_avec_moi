import { prisma } from "../../config/prisma.js";

export const eventsService = {
  async list() {
    // Page events : du plus proche au plus loin (inclut futurs + en cours + passés si tu veux)
    // Si tu veux inclure tout, retire le filtre endDate >= now.
    const events = await prisma.event.findMany({
      where: { isPublished: true },
      orderBy: { startDate: "asc" },
      select: {
        id: true,
        name: true,
        place: true,
        address: true,
        imageUrl: true,
        theme: true,
        description: true,
        startDate: true,
        endDate: true,
      },
    });

    return { events };
  },

  async home() {
    // Home : uniquement en cours + à venir (pas passé)
    const now = new Date();

    const events = await prisma.event.findMany({
      where: {
        isPublished: true,
        endDate: { gte: now },
      },
      orderBy: { startDate: "asc" },
      select: {
        id: true,
        name: true,
        place: true,
        imageUrl: true,
        startDate: true,
        endDate: true,
      },
    });

    return { events };
  },

  async get(id) {
    const event = await prisma.event.findFirst({
      where: { id, isPublished: true },
      select: {
        id: true,
        name: true,
        place: true,
        address: true,
        imageUrl: true,
        theme: true,
        description: true,
        startDate: true,
        endDate: true,
      },
    });

    if (!event) {
      const err = new Error("Event not found");
      err.statusCode = 404;
      throw err;
    }

    return { event };
  },
};
