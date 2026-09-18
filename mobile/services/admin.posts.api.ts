// mobile/services/admin.posts.api.ts
import { apiRequest } from "./api.client";

export type Cursor = { cursorId: string; cursorCreatedAt: string } | null;

export function apiAdminListPosts(params?: {
  limit?: number;
  cursorId?: string | null;
  cursorCreatedAt?: string | null;
}) {
  const qs = new URLSearchParams();

  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.cursorId) qs.set("cursorId", params.cursorId);
  if (params?.cursorCreatedAt) qs.set("cursorCreatedAt", params.cursorCreatedAt);

  const url = qs.toString() ? `/admin/posts?${qs.toString()}` : "/admin/posts";

  return apiRequest<{ posts: any[]; nextCursor: Cursor }>("GET", url, undefined, { auth: true });
}

// le reste inchangé...
export function apiAdminGetPost(id: string) {
  return apiRequest<{ post: any }>("GET", `/admin/posts/${id}`, undefined, { auth: true });
}

export function apiAdminCreatePost(payload: { text: string; images: string[]; isPublished?: boolean }) {
  return apiRequest<{ post: any }>("POST", "/admin/posts", payload, { auth: true });
}

export function apiAdminUpdatePost(
  id: string,
  payload: { text?: string; images?: string[]; isPublished?: boolean }
) {
  return apiRequest<{ post: any }>("PATCH", `/admin/posts/${id}`, payload, { auth: true });
}

export function apiAdminDeletePost(id: string) {
  return apiRequest("DELETE", `/admin/posts/${id}`, undefined, { auth: true });
}

export function apiAdminPublishPost(id: string) {
  return apiRequest("POST", `/admin/posts/${id}/publish`, undefined, { auth: true });
}

export function apiAdminUnpublishPost(id: string) {
  return apiRequest("POST", `/admin/posts/${id}/unpublish`, undefined, { auth: true });
}