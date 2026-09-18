// mobile/services/events.api.ts
import { API_BASE_URL } from "../constants/api";

export async function apiListEvents() {
  const res = await fetch(`${API_BASE_URL}/events`);
  const text = await res.text();
  if (!res.ok) throw new Error(text || "Unable to list events");
  return JSON.parse(text);
}

export async function apiHomeEvents() {
  const res = await fetch(`${API_BASE_URL}/events/home`);
  const text = await res.text();
  if (!res.ok) throw new Error(text || "Unable to load home events");
  return JSON.parse(text);
}

export async function apiGetEvent(id: string) {
  const res = await fetch(`${API_BASE_URL}/events/${id}`);
  const text = await res.text();
  if (!res.ok) throw new Error(text || "Unable to get event");
  return JSON.parse(text);
}
