import { apiRequest } from "./api.client";

export function apiAdminListSeries() {
  return apiRequest<{ series: any[] }>("GET", "/admin/series", undefined, { auth: true });
}

export function apiAdminGetSeries(id: string) {
  return apiRequest<{ series: any }>("GET", `/admin/series/${id}`, undefined, { auth: true });
}

export function apiAdminCreateSeries(payload: {
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  isPublished?: boolean;
  slug?: string | null;
}) {
  return apiRequest<{ series: any }>("POST", "/admin/series", payload, { auth: true });
}

export function apiAdminUpdateSeries(
  id: string,
  payload: {
    title?: string;
    description?: string | null;
    coverUrl?: string | null;
    isPublished?: boolean;
    slug?: string | null;
  }
) {
  return apiRequest<{ series: any }>("PATCH", `/admin/series/${id}`, payload, { auth: true });
}

export function apiAdminPublishSeries(id: string) {
  return apiRequest("POST", `/admin/series/${id}/publish`, undefined, { auth: true });
}

export function apiAdminUnpublishSeries(id: string) {
  return apiRequest("POST", `/admin/series/${id}/unpublish`, undefined, { auth: true });
}

export function apiAdminDeleteSeries(id: string) {
  return apiRequest("DELETE", `/admin/series/${id}`, undefined, { auth: true });
}
