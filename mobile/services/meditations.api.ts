// mobile/services/meditations.api.ts
import { apiRequest } from "./api.client";

export type ApiMeditation = {
  id: string;
  title: string;
  slug: string;
  isPremium: boolean;
  isLocked?: boolean;
  imageUrl?: string | null;
  bodyText: string;
  footerText?: string | null;
  audioUrl?: string | null;
  audioDuration?: string | null;
  series?: { id: string; title: string; slug: string } | null;
  createdAt?: string; // utile pour list
};

export type ApiMeditationListItem = {
  id: string;
  title: string;
  slug: string;
  isPremium: boolean;
  isLocked?: boolean;
  imageUrl?: string | null;
  footerText?: string | null;
  audioUrl?: string | null;
  audioDuration?: string | null;
  createdAt: string;
};

export type Cursor = {
  cursorId: string;
  cursorCreatedAt: string;
} | null;

export function apiDailyMeditation() {
  return apiRequest<{ meditation: (Omit<ApiMeditation, "bodyText"> & { bodyText?: string }) | null }>("GET", "/meditations/daily", undefined, { auth: true });
}

export function apiMeditationDetail(slug: string) {
  return apiRequest<{ meditation: ApiMeditation }>("GET", `/meditations/${encodeURIComponent(slug)}`, undefined, { auth: true });
}

// ✅ NEW: list meditations without series (seriesId = null)
export function apiStandaloneMeditations(params?: {
  limit?: number;
  cursorId?: string | null;
  cursorCreatedAt?: string | null;
}) {
  const qs = new URLSearchParams();

  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.cursorId) qs.set("cursorId", params.cursorId);
  if (params?.cursorCreatedAt) qs.set("cursorCreatedAt", params.cursorCreatedAt);

  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  return apiRequest<{ meditations: ApiMeditationListItem[]; nextCursor: Cursor }>(
    "GET",
    `/meditations/standalone${suffix}`
  );
}