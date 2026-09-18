import { apiRequest } from "./api.client";
export type PremiumStatus = { isPremium: boolean; premiumStartAt: string | null; premiumEndAt: string | null };
export type PremiumCode = {
  id: string; code: string; duration: number; durationUnit: "DAYS" | "MONTHS" | "YEARS";
  status: "AVAILABLE" | "USED" | "EXPIRED" | "DISABLED";
  createdAt: string; usedAt: string | null; expiresAt: string | null;
  usedBy: { id: string; fullName: string; email: string } | null;
};
export const apiPremiumStatus = () => apiRequest<PremiumStatus>("GET", "/premium/status", undefined, { auth: true });
export const apiActivatePremium = (code: string) => apiRequest<PremiumStatus>("POST", "/premium/activate", { code }, { auth: true });
export const apiAdminPremiumCodes = (page = 1) => apiRequest<{ codes: PremiumCode[]; nextPage: number | null }>("GET", `/admin/premium-codes?page=${page}`, undefined, { auth: true });
export const apiAdminCreatePremiumCode = (payload: { code?: string; duration: number; durationUnit: PremiumCode["durationUnit"]; expiresAt?: string }) => apiRequest<{ code: PremiumCode }>("POST", "/admin/premium-codes", payload, { auth: true });
export const apiAdminDisablePremiumCode = (id: string) => apiRequest("PATCH", `/admin/premium-codes/${id}`, { status: "DISABLED" }, { auth: true });
