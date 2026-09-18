import { z } from "zod";
import { prisma } from "../../config/prisma.js";

const dateSchema = z.union([z.string(), z.date()]).transform((v) => {
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
  return d;
});

const createSchema = z.object({
  name: z.string().min(2),
  place: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  theme: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  startDate: dateSchema,
  endDate: dateSchema,
  isPublished: z.boolean().optional(),
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  place: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  theme: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  isPublished: z.boolean().optional(),
});

function ensureDatesOrder(startDate, endDate) {
  if (startDate && endDate && startDate > endDate) {
    const err = new Error("startDate must be before endDate");
    err.statusCode = 422;
    throw err;
  }
}

export const adminEventsService = {
  async list() {
    const events = await prisma.event.findMany({
      orderBy: { startDate: "desc" },
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
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { events };
  },

  async get(id) {
    const event = await prisma.event.findUnique({
      where: { id },
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
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!event) {
      const err = new Error("Event not found");
      err.statusCode = 404;
      throw err;
    }

    return { event };
  },

  async create(payload) {
    const data = createSchema.parse(payload);
    ensureDatesOrder(data.startDate, data.endDate);

    const event = await prisma.event.create({
      data: {
        name: data.name.trim(),
        place: data.place ?? null,
        address: data.address ?? null,
        imageUrl: data.imageUrl ?? null,
        theme: data.theme ?? null,
        description: data.description ?? null,
        startDate: data.startDate,
        endDate: data.endDate,
        isPublished: data.isPublished ?? false,
      },
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
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { event };
  },

  async update(id, payload) {
    const data = updateSchema.parse(payload);

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      const err = new Error("Event not found");
      err.statusCode = 404;
      throw err;
    }

    const nextStart = data.startDate ?? existing.startDate;
    const nextEnd = data.endDate ?? existing.endDate;
    ensureDatesOrder(nextStart, nextEnd);

    const event = await prisma.event.update({
      where: { id },
      data: {
        name: data.name?.trim() ?? undefined,
        place: data.place ?? undefined,
        address: data.address ?? undefined,
        imageUrl: data.imageUrl ?? undefined,
        theme: data.theme ?? undefined,
        description: data.description ?? undefined,
        startDate: data.startDate ?? undefined,
        endDate: data.endDate ?? undefined,
        isPublished: data.isPublished ?? undefined,
      },
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
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { event };
  },

  async remove(id) {
    await prisma.event.delete({ where: { id } });
    return { ok: true };
  },

  async setPublished(id, isPublished) {
    const event = await prisma.event.update({
      where: { id },
      data: { isPublished },
      select: { id: true, name: true, isPublished: true, updatedAt: true },
    });

    return { event };
  },
};
