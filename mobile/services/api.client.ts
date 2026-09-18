// mobile/services/api.client.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants/api";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

async function getToken() {
  return AsyncStorage.getItem("auth_token");
}

export async function apiRequest<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  opts?: { auth?: boolean }
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (opts?.auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data?.message ?? "Erreur API";
    throw Object.assign(new Error(message), { code: data?.code, status: res.status });
  }

  return data as T;
}
