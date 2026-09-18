import { apiRequest } from "./api.client";

export type ApiSeries = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  coverUrl?: string | null;
  _count?: { meditations: number };
  meditations?: Array<{
    id: string;
    title: string;
    slug: string;
    imageUrl?: string | null;
    isPremium: boolean;
    audioDuration?: string | null;
  }>;
};

export function apiListSeries() {
  return apiRequest<{ series: ApiSeries[] }>("GET", "/series");
}

export function apiSeriesDetail(slug: string) {
  return apiRequest<{
    series: ApiSeries & {
      meditations: Array<{
        id: string;
        title: string;
        slug: string;
        imageUrl?: string | null;
        isPremium: boolean;
        audioDuration?: string | null;
      }>;
    };
  }>("GET", `/series/${slug}`);
}
