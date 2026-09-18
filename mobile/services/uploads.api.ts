import { Platform } from "react-native";
// mobile/services/uploads.api.ts
/*import { API_BASE_URL } from "../constants/api";
import { useAuthStore } from "../stores/auth.store";

export async function apiAdminUploadFile(fileUri: string, name: string, mime: string) {
  const token = useAuthStore.getState().token;

  const form = new FormData();
  form.append("file", {
    uri: fileUri,
    name,
    type: mime,
  } as any);

  const url = `${API_BASE_URL}/admin/uploads`;
  console.log("UPLOAD URL =>", url);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      // ❌ surtout pas Content-Type ici
    },
    body: form,
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || `Upload failed (${res.status})`);

  return JSON.parse(text);
}
*/
// mobile/services/uploads.api.ts
import { API_BASE_URL } from "../constants/api";
import { useAuthStore } from "../stores/auth.store";

export async function apiAdminUploadFile(fileUri: string, name: string, mime: string, privateAudio = false) {
  const token = useAuthStore.getState().token;

  if (!token) {
    throw new Error("Unauthenticated");
  }

  const form = new FormData();
  if (Platform.OS === "web") {
    const response = await fetch(fileUri);
    form.append("file", await response.blob(), name);
  } else {
    form.append("file", { uri: fileUri, name, type: mime } as any);
  }

  // ✅ IMPORTANT: ton backend actuel est POST /upload
  const url = `${API_BASE_URL}/admin/uploads${privateAudio ? "/premium-audio" : ""}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      // ❌ surtout pas Content-Type ici (boundary auto)
    },
    body: form,
  });

  // ✅ On lit en texte puis on tente JSON (parfois Express renvoie texte)
  const raw = await res.text();
  let data: any = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { message: raw };
  }

  if (!res.ok) {
    throw new Error(data?.message ?? `Upload failed (${res.status})`);
  }

  // attendu: { file: { url, filename, mimetype, size } }
  return data as {
    file: { url: string; filename: string; mimetype: string; size: number };
  };
}
