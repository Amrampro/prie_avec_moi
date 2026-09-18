import { apiRequest } from "./api.client";

export function apiAdminListMeditations() {
  return apiRequest<{ meditations: any[] }>("GET", "/admin/meditations", undefined, { auth: true });
}

export function apiAdminGetMeditation(id: string) {
  return apiRequest<{ meditation: any }>("GET", `/admin/meditations/${id}`, undefined, { auth: true });
}

export function apiAdminCreateMeditation(payload: {
  title: string;
  bodyText: string;
  footerText?: string | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
  audioDuration?: string | null;
  seriesId?: string | null;
  isPremium?: boolean;
  isPublished?: boolean;
  slug?: string | null;
}) {
  return apiRequest<{ meditation: any }>("POST", "/admin/meditations", payload, { auth: true });
}

export function apiAdminUpdateMeditation(
  id: string,
  payload: Partial<{
    title: string;
    bodyText: string;
    footerText: string | null;
    imageUrl: string | null;
    audioUrl: string | null;
    audioDuration: string | null;
    seriesId: string | null;
    isPremium: boolean;
    isPublished: boolean;
    slug: string | null;
  }>
) {
  return apiRequest<{ meditation: any }>("PATCH", `/admin/meditations/${id}`, payload, { auth: true });
}

export function apiAdminPublishMeditation(id: string) {
  return apiRequest("POST", `/admin/meditations/${id}/publish`, undefined, { auth: true });
}

export function apiAdminUnpublishMeditation(id: string) {
  return apiRequest("POST", `/admin/meditations/${id}/unpublish`, undefined, { auth: true });
}

export function apiAdminDeleteMeditation(id: string) {
  return apiRequest("DELETE", `/admin/meditations/${id}`, undefined, { auth: true });
}
