import { isUserPremium } from "../premium/premium.logic.js";
// api/src/modules/posts/posts.service.js
import { z } from "zod";
import { prisma } from "../../config/prisma.js";

function requireAuthUserId(userId) {
  if (!userId) {
    const err = new Error("Unauthenticated");
    err.statusCode = 401;
    throw err;
  }
  return userId;
}

const commentSchema = z.object({
  text: z.string().min(1).max(2000),
});

const postSelectBase = {
  id: true,
  text: true,
  isPublished: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, fullName: true, avatarUrl: true, isAdmin: true, premiumEndAt: true } },
  images: { orderBy: { order: "asc" }, select: { id: true, imageUrl: true, order: true } },
  _count: { select: { likes: true, comments: true } },
};

export const postsService = {
  async list({ userId, limit = 20, cursorId = null, cursorCreatedAt = null }) {
    const take = Math.max(1, Math.min(Number(limit) || 20, 50));

    const where = { isPublished: true };

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
      select: postSelectBase,
    });

    let likedMap = new Map();
    if (userId && posts.length) {
      const likes = await prisma.postLike.findMany({
        where: { userId, postId: { in: posts.map((p) => p.id) } },
        select: { postId: true },
      });
      likedMap = new Map(likes.map((l) => [l.postId, true]));
    }

    const feed = posts.map((p) => ({
      id: p.id,
      text: p.text,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      author: { ...p.author, isPremium: isUserPremium(p.author) },
      images: p.images,
      likesCount: p._count.likes,
      commentsCount: p._count.comments,
      isLikedByMe: userId ? Boolean(likedMap.get(p.id)) : false,
    }));

    const last = feed[feed.length - 1] ?? null;
    const nextCursor = last
      ? { cursorId: last.id, cursorCreatedAt: last.createdAt }
      : null;

    return { posts: feed, nextCursor };
  },

  async detail(id, { userId }) {
    const post = await prisma.post.findFirst({
      where: { id, isPublished: true },
      select: postSelectBase,
    });

    if (!post) {
      const err = new Error("Post not found");
      err.statusCode = 404;
      throw err;
    }

    let isLikedByMe = false;
    if (userId) {
      const like = await prisma.postLike.findUnique({
        where: { postId_userId: { postId: id, userId } },
        select: { id: true },
      });
      isLikedByMe = Boolean(like);
    }

    return {
      post: {
        id: post.id,
        text: post.text,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: { ...post.author, isPremium: isUserPremium(post.author) },
        images: post.images,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        isLikedByMe,
      },
    };
  },

  async like(postId, userId) {
    userId = requireAuthUserId(userId);

    // ensure post exists & published
    const post = await prisma.post.findFirst({ where: { id: postId, isPublished: true }, select: { id: true } });
    if (!post) {
      const err = new Error("Post not found");
      err.statusCode = 404;
      throw err;
    }

    // upsert like
    await prisma.postLike.upsert({
      where: { postId_userId: { postId, userId } },
      create: { postId, userId },
      update: {},
    });

    const likesCount = await prisma.postLike.count({ where: { postId } });
    return { ok: true, postId, likesCount, isLikedByMe: true };
  },

  async unlike(postId, userId) {
    userId = requireAuthUserId(userId);

    await prisma.postLike
      .delete({ where: { postId_userId: { postId, userId } } })
      .catch(() => null);

    const likesCount = await prisma.postLike.count({ where: { postId } });
    return { ok: true, postId, likesCount, isLikedByMe: false };
  },

  async listComments(postId) {
    // ensure post exists & published
    const post = await prisma.post.findFirst({ where: { id: postId, isPublished: true }, select: { id: true } });
    if (!post) {
      const err = new Error("Post not found");
      err.statusCode = 404;
      throw err;
    }

    const comments = await prisma.postComment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" }, // comments oldest->newest inside the post
      select: {
        id: true,
        text: true,
        createdAt: true,
        user: { select: { id: true, fullName: true, avatarUrl: true, isAdmin: true, premiumEndAt: true } },
      },
    });

    return { comments: comments.map(comment => ({ ...comment, user: { ...comment.user, isPremium: isUserPremium(comment.user) } })) };
  },

  async createComment(postId, userId, payload) {
    userId = requireAuthUserId(userId);

    const data = commentSchema.parse(payload);

    // ensure post exists & published
    const post = await prisma.post.findFirst({ where: { id: postId, isPublished: true }, select: { id: true } });
    if (!post) {
      const err = new Error("Post not found");
      err.statusCode = 404;
      throw err;
    }

    const comment = await prisma.postComment.create({
      data: {
        postId,
        userId,
        text: data.text.trim(),
      },
      select: {
        id: true,
        text: true,
        createdAt: true,
        user: { select: { id: true, fullName: true, avatarUrl: true, isAdmin: true, premiumEndAt: true } },
      },
    });

    const commentsCount = await prisma.postComment.count({ where: { postId } });

    return { comment: { ...comment, user: { ...comment.user, isPremium: isUserPremium(comment.user) } }, commentsCount };
  },
};
