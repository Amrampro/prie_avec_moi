// api/src/modules/admin-users/admin.users.service.js
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

const updateRoleSchema = z.object({
  isAdmin: z.boolean(),
});

const userSelectBase = {
  id: true,
  fullName: true,
  email: true,
  avatarUrl: true,
  isAdmin: true,
  createdAt: true,
  updatedAt: true,
};

export const adminUsersService = {
  /**
   * Pagination stable: createdAt desc, id desc
   * limit par défaut 20, max 50
   * Option: q => filtre sur fullName ou email
   */
  async list({ limit = 20, cursorId = null, cursorCreatedAt = null, q = null }) {
    const take = Math.max(1, Math.min(Number(limit) || 20, 50));

    const where = {};

    // filtre recherche simple
    if (q && String(q).trim().length > 0) {
      const query = String(q).trim();
      where.OR = [
        { fullName: { contains: query } },
        { email: { contains: query } },
      ];
    }

    // pagination cursor
    if (cursorId && cursorCreatedAt) {
      const cursorDate = new Date(cursorCreatedAt);

      // si where.OR existe déjà (recherche), on doit combiner proprement
      // => on met la pagination dans un AND
      const paginationOR = [
        { createdAt: { lt: cursorDate } },
        { createdAt: cursorDate, id: { lt: cursorId } },
      ];

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: paginationOR }];
        delete where.OR;
      } else {
        where.OR = paginationOR;
      }
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      select: {
        ...userSelectBase,
        _count: {
          select: {
            favorites: true,
            posts: true,
            postLikes: true,
            postComments: true,
          },
        },
      },
    });

    const items = users.map((u) => ({
      ...u,
      counts: {
        favorites: u._count.favorites,
        posts: u._count.posts,
        postLikes: u._count.postLikes,
        postComments: u._count.postComments,
      },
      _count: undefined,
    }));

    const last = items[items.length - 1] ?? null;
    const nextCursor = last
      ? { cursorId: last.id, cursorCreatedAt: last.createdAt }
      : null;

    return { users: items, nextCursor };
  },

  /**
   * Détails user pour admin:
   * - infos de base
   * - compteurs
   * - (optionnel) dernières activités: derniers posts / commentaires / likes (utile pour admin)
   */
  async detail(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...userSelectBase,
        _count: {
          select: {
            favorites: true,
            posts: true,
            postLikes: true,
            postComments: true,
          },
        },

        // petites "vues" utiles dans un panneau admin
        posts: {
          take: 5,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          select: { id: true, text: true, isPublished: true, createdAt: true },
        },
        postComments: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            text: true,
            createdAt: true,
            post: { select: { id: true } },
          },
        },
        postLikes: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            createdAt: true,
            post: { select: { id: true } },
          },
        },
      },
    });

    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    return {
      user: {
        ...user,
        counts: {
          favorites: user._count.favorites,
          posts: user._count.posts,
          postLikes: user._count.postLikes,
          postComments: user._count.postComments,
        },
        _count: undefined,
      },
    };
  },

  /**
   * Changer le rôle (admin-only, déjà géré au niveau route/middlewares)
   * Règle de sécurité: un admin ne peut pas se retirer son propre admin (optionnel, mais conseillé)
   */
  async updateRole(targetUserId, payload, { actorUserId }) {
    actorUserId = requireAuthUserId(actorUserId);

    const data = updateRoleSchema.parse(payload);

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, isAdmin: true },
    });

    if (!target) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    // Empêcher un admin de se retirer son propre rôle (évite de se lock-out)
    if (targetUserId === actorUserId && data.isAdmin === false) {
      const err = new Error("You cannot remove your own admin role");
      err.statusCode = 400;
      throw err;
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { isAdmin: data.isAdmin },
      select: userSelectBase,
    });

    return { ok: true, user: updated };
  },

  /**
   * Supprimer un user (admin-only)
   * Règle de sécurité: empêcher la suppression de soi-même (souvent utile)
   * Prisma cascade gère posts, likes, comments, favorites via onDelete: Cascade
   */
  async remove(targetUserId, { actorUserId }) {
    actorUserId = requireAuthUserId(actorUserId);

    if (targetUserId === actorUserId) {
      const err = new Error("You cannot delete your own account");
      err.statusCode = 400;
      throw err;
    }

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!target) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    await prisma.user.delete({ where: { id: targetUserId } });

    return { ok: true, deletedUserId: targetUserId };
  },
};
