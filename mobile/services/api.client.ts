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

    // Important actuellement pour éviter les anciens 404 mis en cache
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  };

  if (opts?.auth) {
    const token = await getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const url = `${API_BASE_URL}${path}`;

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();

    let data: any = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      const message =
        data?.message ||
        data?.error ||
        `API ${res.status} ${method} ${path}`;

      throw Object.assign(new Error(message), {
        code: data?.code,
        status: res.status,
        body: data,
      });
    }

    return data as T;
  } catch (error: any) {
    console.log("API ERROR:", {
      url,
      method,
      message: error?.message,
      status: error?.status,
    });

    throw error;
  }
}