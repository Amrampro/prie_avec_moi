// mobile/services/posts.api.ts
import { apiRequest } from "./api.client";

// export function apiListPosts() {
//   return apiRequest<{ posts: any[] }>("GET", "/posts", undefined, { auth: true });
// }

export function apiListPosts(params?: {
  limit?: number;
  cursorId?: string | null;
  cursorCreatedAt?: string | null;
}) {
  const qs = new URLSearchParams();

  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.cursorId) qs.set("cursorId", params.cursorId);
  if (params?.cursorCreatedAt) qs.set("cursorCreatedAt", params.cursorCreatedAt);

  const url = qs.toString() ? `/posts?${qs.toString()}` : "/posts";

  return apiRequest<{ posts: any[]; nextCursor: null | { cursorId: string; cursorCreatedAt: string } }>(
    "GET",
    url,
    undefined,
    { auth: true }
  );
}

export function apiLikePost(id: string) {
  return apiRequest<{ ok: true; postId: string; likesCount: number; isLikedByMe: boolean }>(
    "POST",
    `/posts/${id}/like`,
    undefined,
    { auth: true }
  );
}

export function apiUnlikePost(id: string) {
  return apiRequest<{ ok: true; postId: string; likesCount: number; isLikedByMe: boolean }>(
    "POST",
    `/posts/${id}/unlike`,
    undefined,
    { auth: true }
  );
}

export function apiPostDetail(id: string) {
  return apiRequest<{ post: any }>("GET", `/posts/${id}`, undefined, { auth: true });
}

// export function apiLikePost(id: string) {
//   return apiRequest("POST", `/posts/${id}/like`, undefined, { auth: true });
// }

// export function apiUnlikePost(id: string) {
//   return apiRequest("POST", `/posts/${id}/unlike`, undefined, { auth: true });
// }

export function apiListPostComments(id: string) {
  return apiRequest<{ comments: any[] }>("GET", `/posts/${id}/comments`);
}

export function apiCreatePostComment(id: string, payload: { text: string }) {
  return apiRequest<{ comment: any; commentsCount: number }>(
    "POST",
    `/posts/${id}/comments`,
    payload,
    { auth: true }
  );
}
