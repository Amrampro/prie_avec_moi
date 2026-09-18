// mobile/services/account.api.ts
import { apiRequest } from "./api.client";
import type { ApiUser } from "./auth.api";

export type AccountMeResponse = {
  user: ApiUser;
};

export type AccountUpdatePayload = {
  fullName?: string;
  email?: string;
  avatarUrl?: string | null;

  // optional password change
  currentPassword?: string;
  newPassword?: string;
};

export type AccountUpdateResponse = {
  user: ApiUser;
};

export type AccountDeletePayload = {
  currentPassword: string;
};

export type AccountDeleteResponse = {
  ok: true;
};

export function apiAccountMe() {
  return apiRequest<AccountMeResponse>("GET", "/account/me", undefined, { auth: true });
}

export function apiAccountUpdate(payload: AccountUpdatePayload) {
  return apiRequest<AccountUpdateResponse>("PATCH", "/account", payload, { auth: true });
}

export function apiAccountDelete(payload: AccountDeletePayload) {
  return apiRequest<AccountDeleteResponse>("DELETE", "/account", payload, { auth: true });
}
