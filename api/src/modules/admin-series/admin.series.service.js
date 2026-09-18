// api/src/modules/admin-series/admin.series.service.js
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { uniqueSlug } from "../../utils/slug.js";

const createSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
  slug: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
});

const updateSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
  slug: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
});

export const adminSeriesService = {
  async list() {
    const series = await prisma.series.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverUrl: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { meditations: true } },
      },
    });
    return { series };
  },

  async get(id) {
    const series = await prisma.series.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverUrl: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!series) {
      const err = new Error("Series not found");
      err.statusCode = 404;
      throw err;
    }

    return { series };
  },

  async create(payload) {
    const data = createSchema.parse(payload);

    const slug =
      data.slug?.trim() ||
      (await uniqueSlug(
        async (s) => Boolean(await prisma.series.findUnique({ where: { slug: s } })),
        data.title
      ));

    if (!slug) {
      const err = new Error("Unable to generate slug");
      err.statusCode = 400;
      throw err;
    }

    const series = await prisma.series.create({
      data: {
        title: data.title,
        slug,
        description: data.description ?? null,
        coverUrl: data.coverUrl ?? null,
        isPublished: data.isPublished ?? false,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverUrl: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { series };
  },

  async update(id, payload) {
    const data = updateSchema.parse(payload);

    const existing = await prisma.series.findUnique({ where: { id } });
    if (!existing) {
      const err = new Error("Series not found");
      err.statusCode = 404;
      throw err;
    }

    let slug = data.slug?.trim() ?? undefined;

    // If title changed and slug not provided, we can auto-regenerate
    if (!slug && data.title && data.title !== existing.title) {
      slug = await uniqueSlug(
        async (s) => Boolean(await prisma.series.findUnique({ where: { slug: s } })),
        data.title
      );
    }

    // If slug provided, ensure uniqueness (if changed)
    if (slug && slug !== existing.slug) {
      const exists = await prisma.series.findUnique({ where: { slug } });
      if (exists) {
        const err = new Error("Slug already used");
        err.statusCode = 409;
        throw err;
      }
    }

    const series = await prisma.series.update({
      where: { id },
      data: {
        title: data.title ?? undefined,
        slug: slug ?? undefined,
        description: data.description ?? undefined,
        coverUrl: data.coverUrl ?? undefined,
        isPublished: data.isPublished ?? undefined,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverUrl: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { series };
  },

  async remove(id) {
    // if you want to keep meditations, you can set seriesId null before delete.
    await prisma.meditation.updateMany({
      where: { seriesId: id },
      data: { seriesId: null },
    });

    await prisma.series.delete({ where: { id } });

    return { ok: true };
  },

  async setPublished(id, isPublished) {
    const series = await prisma.series.update({
      where: { id },
      data: { isPublished },
      select: {
        id: true,
        title: true,
        slug: true,
        isPublished: true,
        updatedAt: true,
      },
    });

    return { series };
  },
};
