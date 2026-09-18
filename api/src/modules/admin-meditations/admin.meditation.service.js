import { validatePremiumAudio } from "../meditations/meditation.audio.js";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { uniqueSlug } from "../../utils/slug.js";

const createSchema = z.object({
  title: z.string().min(2),
  bodyText: z.string().min(2),
  footerText: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  audioUrl: z.string().url().optional().nullable(),
  audioDuration: z.string().optional().nullable(), // "07:34"
  seriesId: z.string().optional().nullable(),
  slug: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
  isPremium: z.boolean().optional(),
});

const updateSchema = z.object({
  title: z.string().min(2).optional(),
  bodyText: z.string().min(2).optional(),
  footerText: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  audioUrl: z.string().url().optional().nullable(),
  audioDuration: z.string().optional().nullable(),
  seriesId: z.string().optional().nullable(),
  slug: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
  isPremium: z.boolean().optional(),
});

export const adminMeditationService = {
  async list(query) {
    const seriesId = query?.seriesId ? String(query.seriesId) : null;

    const meditations = await prisma.meditation.findMany({
      where: seriesId ? { seriesId } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        imageUrl: true,
        audioUrl: true,
        audioDuration: true,
        isPublished: true,
        isPremium: true,
        createdAt: true,
        updatedAt: true,
        series: { select: { id: true, title: true, slug: true } },
      },
    });

    return { meditations };
  },

  async get(id) {
    const meditation = await prisma.meditation.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        imageUrl: true,
        bodyText: true,
        footerText: true,
        audioUrl: true,
        audioDuration: true,
        isPublished: true,
        isPremium: true,
        createdAt: true,
        updatedAt: true,
        series: { select: { id: true, title: true, slug: true } },
        seriesId: true,
      },
    });

    if (!meditation) {
      const err = new Error("Meditation not found");
      err.statusCode = 404;
      throw err;
    }

    return { meditation };
  },

  async create(payload) {
    const data = createSchema.parse(payload);
    await validatePremiumAudio(data);

    if (data.seriesId) {
      const s = await prisma.series.findUnique({ where: { id: data.seriesId } });
      if (!s) {
        const err = new Error("Series not found (seriesId invalid)");
        err.statusCode = 400;
        throw err;
      }
    }

    const slug =
      data.slug?.trim() ||
      (await uniqueSlug(
        async (s) => Boolean(await prisma.meditation.findUnique({ where: { slug: s } })),
        data.title
      ));

    if (!slug) {
      const err = new Error("Unable to generate slug");
      err.statusCode = 400;
      throw err;
    }

    const meditation = await prisma.meditation.create({
      data: {
        title: data.title,
        slug,
        bodyText: data.bodyText,
        footerText: data.footerText ?? null,
        imageUrl: data.imageUrl ?? null,
        audioUrl: data.audioUrl ?? null,
        audioDuration: data.audioDuration ?? null,
        seriesId: data.seriesId ?? null,
        isPublished: data.isPublished ?? false,
        isPremium: data.isPremium ?? false,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        imageUrl: true,
        audioUrl: true,
        audioDuration: true,
        isPublished: true,
        isPremium: true,
        createdAt: true,
        updatedAt: true,
        series: { select: { id: true, title: true, slug: true } },
      },
    });

    return { meditation };
  },

  async update(id, payload) {
    const data = updateSchema.parse(payload);

    const existing = await prisma.meditation.findUnique({ where: { id } });
    if (!existing) {
      const err = new Error("Meditation not found");
      err.statusCode = 404;
      throw err;
    }

    if (data.seriesId) {
      const s = await prisma.series.findUnique({ where: { id: data.seriesId } });
      if (!s) {
        const err = new Error("Series not found (seriesId invalid)");
        err.statusCode = 400;
        throw err;
      }
    }

    await validatePremiumAudio({ ...existing, ...data });

    let slug = data.slug?.trim() ?? undefined;

    // If title changed and slug not provided, auto-regenerate
    if (!slug && data.title && data.title !== existing.title) {
      slug = await uniqueSlug(
        async (s) => Boolean(await prisma.meditation.findUnique({ where: { slug: s } })),
        data.title
      );
    }

    // If slug provided, ensure uniqueness (if changed)
    if (slug && slug !== existing.slug) {
      const exists = await prisma.meditation.findUnique({ where: { slug } });
      if (exists) {
        const err = new Error("Slug already used");
        err.statusCode = 409;
        throw err;
      }
    }

    const meditation = await prisma.meditation.update({
      where: { id },
      data: {
        title: data.title ?? undefined,
        slug: slug ?? undefined,
        bodyText: data.bodyText ?? undefined,
        footerText: data.footerText ?? undefined,
        imageUrl: data.imageUrl ?? undefined,
        audioUrl: data.audioUrl,
        audioDuration: data.audioDuration ?? undefined,
        seriesId: data.seriesId,
        isPublished: data.isPublished ?? undefined,
        isPremium: data.isPremium,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        imageUrl: true,
        audioUrl: true,
        audioDuration: true,
        isPublished: true,
        isPremium: true,
        createdAt: true,
        updatedAt: true,
        series: { select: { id: true, title: true, slug: true } },
      },
    });

    return { meditation };
  },

  async remove(id) {
    // Favorites will cascade delete because Favorite references Meditation with onDelete: Cascade
    await prisma.meditation.delete({ where: { id } });
    return { ok: true };
  },

  async setPublished(id, isPublished) {
    const meditation = await prisma.meditation.update({
      where: { id },
      data: { isPublished },
      select: {
        id: true,
        title: true,
        slug: true,
        isPublished: true,
        isPremium: true,
        updatedAt: true,
      },
    });

    return { meditation };
  },
};
