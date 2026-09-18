// mobile/services/my.posts.api.ts
import { apiRequest } from "./api.client";

export function apiMyListPosts() {
  return apiRequest<{ posts: any[] }>("GET", "/my-posts", undefined, { auth: true });
}

export function apiMyGetPost(id: string) {
  return apiRequest<{ post: any }>("GET", `/my-posts/${id}`, undefined, { auth: true });
}

export function apiMyCreatePost(payload: { text: string; images: string[]; isPublished?: boolean }) {
  return apiRequest<{ post: any }>("POST", "/my-posts", payload, { auth: true });
}

export function apiMyUpdatePost(
  id: string,
  payload: { text?: string; images?: string[]; isPublished?: boolean }
) {
  return apiRequest<{ post: any }>("PATCH", `/my-posts/${id}`, payload, { auth: true });
}

export function apiMyDeletePost(id: string) {
  return apiRequest("DELETE", `/my-posts/${id}`, undefined, { auth: true });
}

export function apiMyPublishPost(id: string) {
  return apiRequest("POST", `/my-posts/${id}/publish`, undefined, { auth: true });
}

export function apiMyUnpublishPost(id: string) {
  return apiRequest("POST", `/my-posts/${id}/unpublish`, undefined, { auth: true });
}