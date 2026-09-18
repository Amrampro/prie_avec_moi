// api/src/modules/my-posts/my.posts.service.js
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

// Même select que côté admin (tu peux l’extraire en constante partagée si tu veux)
const selectMy = {
  id: true,
  text: true,
  isPublished: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, fullName: true, avatarUrl: true, isAdmin: true } },
  images: { orderBy: { order: "asc" }, select: { id: true, imageUrl: true, order: true } },
  _count: { select: { likes: true, comments: true } },
};

function notFoundOrForbidden() {
  const err = new Error("Post not found");
  err.statusCode = 404; // volontairement 404 pour ne pas révéler l’existence d’un post d’un autre user
  return err;
}

export const myPostsService = {
  async list(userId) {
    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      select: selectMy,
    });

    return {
      posts: posts.map((p) => ({
        ...p,
        likesCount: p._count.likes,
        commentsCount: p._count.comments,
      })),
    };
  },

  async get(userId, id) {
    const post = await prisma.post.findFirst({
      where: { id, authorId: userId },
      select: selectMy,
    });

    if (!post) throw notFoundOrForbidden();

    return {
      post: {
        ...post,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
      },
    };
  },

  async create(userId, payload) {
    const data = createSchema.parse(payload);

    const post = await prisma.post.create({
      data: {
        text: data.text.trim(),
        authorId: userId,
        isPublished: data.isPublished ?? false,
        images: {
          create: data.images.map((url, idx) => ({
            imageUrl: url,
            order: idx,
          })),
        },
      },
      select: selectMy,
    });

    return {
      post: {
        ...post,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
      },
    };
  },

  async update(userId, id, payload) {
    const data = updateSchema.parse(payload);

    const existing = await prisma.post.findFirst({
      where: { id, authorId: userId },
      select: { id: true },
    });

    if (!existing) throw notFoundOrForbidden();

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
      select: selectMy,
    });

    return {
      post: {
        ...post,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
      },
    };
  },

  async remove(userId, id) {
    const existing = await prisma.post.findFirst({
      where: { id, authorId: userId },
      select: { id: true },
    });

    if (!existing) throw notFoundOrForbidden();

    await prisma.post.delete({ where: { id } });
    return { ok: true };
  },

  async setPublished(userId, id, isPublished) {
    const existing = await prisma.post.findFirst({
      where: { id, authorId: userId },
      select: { id: true },
    });

    if (!existing) throw notFoundOrForbidden();

    const post = await prisma.post.update({
      where: { id },
      data: { isPublished },
      select: { id: true, isPublished: true, updatedAt: true },
    });

    return { post };
  },
};