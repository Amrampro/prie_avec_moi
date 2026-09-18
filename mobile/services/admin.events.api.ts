// mobile/services/admin.events.api.ts
import { API_BASE_URL } from "../constants/api";
import { useAuthStore } from "../stores/auth.store";

function authHeaders() {
  const token = useAuthStore.getState().token;
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function parse(res: Response) {
  const text = await res.text();
  if (!res.ok) throw new Error(text || "Request failed");
  return JSON.parse(text);
}

export async function apiAdminListEvents() {
  const res = await fetch(`${API_BASE_URL}/admin/events`, { headers: authHeaders() });
  return parse(res);
}

export async function apiAdminGetEvent(id: string) {
  const res = await fetch(`${API_BASE_URL}/admin/events/${id}`, { headers: authHeaders() });
  return parse(res);
}

export async function apiAdminCreateEvent(payload: any) {
  const res = await fetch(`${API_BASE_URL}/admin/events`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parse(res);
}

export async function apiAdminUpdateEvent(id: string, payload: any) {
  const res = await fetch(`${API_BASE_URL}/admin/events/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parse(res);
}

export async function apiAdminDeleteEvent(id: string) {
  const res = await fetch(`${API_BASE_URL}/admin/events/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return parse(res);
}

export async function apiAdminPublishEvent(id: string) {
  const res = await fetch(`${API_BASE_URL}/admin/events/${id}/publish`, {
    method: "POST",
    headers: authHeaders(),
  });
  return parse(res);
}

export async function apiAdminUnpublishEvent(id: string) {
  const res = await fetch(`${API_BASE_URL}/admin/events/${id}/unpublish`, {
    method: "POST",
    headers: authHeaders(),
  });
  return parse(res);
}
