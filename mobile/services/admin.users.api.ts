// mobile/services/admin.users.api.ts
import { apiRequest } from "./api.client";

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  counts?: {
    favorites?: number;
    posts?: number;
    postLikes?: number;
    postComments?: number;
  };
};

export type Cursor = { cursorId: string; cursorCreatedAt: string } | null;

export function apiAdminListUsers(params?: {
  limit?: number;
  cursorId?: string;
  cursorCreatedAt?: string;
  q?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.cursorId) qs.set("cursorId", params.cursorId);
  if (params?.cursorCreatedAt) qs.set("cursorCreatedAt", params.cursorCreatedAt);
  if (params?.q) qs.set("q", params.q);

  const url = qs.toString() ? `/admin/users?${qs.toString()}` : "/admin/users";
  return apiRequest<{ users: AdminUser[]; nextCursor: Cursor }>("GET", url, undefined, { auth: true });
}

export function apiAdminGetUser(id: string) {
  return apiRequest<{ user: AdminUser }>("GET", `/admin/users/${id}`, undefined, { auth: true });
}

export function apiAdminUpdateUserRole(id: string, payload: { isAdmin: boolean }) {
  return apiRequest<{ ok: boolean; user: AdminUser }>(
    "PATCH",
    `/admin/users/${id}/role`,
    payload,
    { auth: true }
  );
}

export function apiAdminDeleteUser(id: string) {
  return apiRequest<{ ok: boolean; deletedUserId: string }>(
    "DELETE",
    `/admin/users/${id}`,
    undefined,
    { auth: true }
  );
}
