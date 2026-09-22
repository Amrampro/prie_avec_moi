// mobile/services/auth.api.ts
import { apiRequest } from "./api.client";

export type ApiUser = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  isAdmin: boolean;
  role?: "MEMBRE" | "ACCOMPAGNATEUR" | "ADMINISTRATEUR";
  isPremium?: boolean;
  premiumStartAt?: string | null;
  premiumEndAt?: string | null;
};

export type AuthResponse = {
  user: ApiUser;
  token: string;
};

export function apiSignIn(payload: { email: string; password: string }) {
  return apiRequest<AuthResponse>("POST", "/auth/signin", payload);
}

export function apiSignUp(payload: { fullName: string; email: string; password: string }) {
  return apiRequest<AuthResponse>("POST", "/auth/signup", payload);
}
