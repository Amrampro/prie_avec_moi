// api/src/modules/admin-posts/admin.posts.service.js
import { z } from "zod";
import { prisma } from "../../config/prisma.js";

const createSchema = z.object({
  text: z.string().min(1).max(5000),
  images: z.array(z.string().url()).min(1).max(10),
  isPublished: z.boolean().optional(),
});

const updateSchema = z.object({
  text: z.string().min(1).max(5000).optional(),
  images: z.array(z.string().url()).min(1).max(10).optional(),
  isPublished: z.boolean().optional(),
});

const selectAdmin = {
  id: true,
  text: true,
  isPublished: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, fullName: true, avatarUrl: true, isAdmin: true } },
  images: { orderBy: { order: "asc" }, select: { id: true, imageUrl: true, order: true } },
  _count: { select: { likes: true, comments: true } },
};

export const adminPostsService = {
  /**
   * Pagination stable: createdAt desc, id desc
   * limit par défaut 10, max 50
   */
  async list({ limit = 10, cursorId = null, cursorCreatedAt = null }) {
    const take = Math.max(1, Math.min(Number(limit) || 10, 50));

    const where = {};

    // pagination stable: (createdAt desc, id desc)
    if (cursorId && cursorCreatedAt) {
      const cursorDate = new Date(cursorCreatedAt);
      where.OR = [
        { createdAt: { lt: cursorDate } },
        { createdAt: cursorDate, id: { lt: cursorId } },
      ];
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      select: selectAdmin,
    });

    const items = posts.map((p) => ({
      ...p,
      likesCount: p._count.likes,
      commentsCount: p._count.comments,
    }));

    const last = items[items.length - 1] ?? null;
    const nextCursor = last ? { cursorId: last.id, cursorCreatedAt: last.createdAt } : null;

    return { posts: items, nextCursor };
  },

  async get(id) {
    const post = await prisma.post.findUnique({
      where: { id },
      select: selectAdmin,
    });

    if (!post) {
      const err = new Error("Post not found");
      err.statusCode = 404;
      throw err;
    }

    return {
      post: {
        ...post,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
      },
    };
  },

  async create(authorId, payload) {
    const data = createSchema.parse(payload);

    const post = await prisma.post.create({
      data: {
        text: data.text.trim(),
        authorId,
        isPublished: data.isPublished ?? false,
        images: {
          create: data.images.map((url, idx) => ({
            imageUrl: url,
            order: idx,
          })),
        },
      },
      select: selectAdmin,
    });

    return {
      post: {
        ...post,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
      },
    };
  },

  async update(id, payload) {
    const data = updateSchema.parse(payload);

    const existing = await prisma.post.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      const err = new Error("Post not found");
      err.statusCode = 404;
      throw err;
    }

    if (data.images) {
      await prisma.postImage.deleteMany({ where: { postId: id } });
      await prisma.postImage.createMany({
        data: data.images.map((url, idx) => ({ postId: id, imageUrl: url, order: idx })),
      });
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        text: data.text ? data.text.trim() : undefined,
        isPublished: data.isPublished ?? undefined,
      },
      select: selectAdmin,
    });

    return {
      post: {
        ...post,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
      },
    };
  },

  async remove(id) {
    await prisma.post.delete({ where: { id } });
    return { ok: true };
  },

  async setPublished(id, isPublished) {
    const post = await prisma.post.update({
      where: { id },
      data: { isPublished },
      select: { id: true, isPublished: true, updatedAt: true },
    });

    return { post };
  },
};