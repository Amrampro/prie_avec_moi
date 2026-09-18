import { apiRequest } from "./api.client";

export function apiListFavorites() {
  return apiRequest<{
    favorites: Array<{
      id: string;
      createdAt: string;
      meditation: {
        id: string;
        title: string;
        slug: string;
        imageUrl?: string | null;
        isPremium: boolean;
        audioDuration?: string | null;
      };
    }>;
  }>("GET", "/favorites", undefined, { auth: true });
}

export function apiAddFavorite(meditationId: string) {
  return apiRequest<{ favorite: { id: string; createdAt: string } }>(
    "POST",
    `/favorites/${meditationId}`,
    undefined,
    { auth: true }
  );
}

export function apiRemoveFavorite(meditationId: string) {
  return apiRequest<{ ok: true }>("DELETE", `/favorites/${meditationId}`, undefined, { auth: true });
}
