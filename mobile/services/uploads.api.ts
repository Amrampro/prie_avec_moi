import { Platform } from "react-native";
import { File, UploadType } from "expo-file-system";
import { fetch } from "expo/fetch";
import { API_BASE_URL } from "../constants/api";
import { useAuthStore } from "../stores/auth.store";

export async function apiAdminUploadFile(fileUri: string, name: string, mime: string, privateAudio = false, proof?: Record<string, string>, prayerProgramId?: string) {
  const token = useAuthStore.getState().token;

  if (!token) {
    throw new Error("Unauthenticated");
  }

  const url = `${API_BASE_URL}/admin/uploads${proof ? "/proof" : prayerProgramId ? `/prayer-audio/${prayerProgramId}` : privateAudio ? "/premium-audio" : ""}`;
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
  let status: number;
  let raw: string;

  if (Platform.OS === "web") {
    const response = await fetch(fileUri);
    if (!response.ok) throw new Error("Impossible de lire le fichier sélectionné.");
    const form = new FormData();
    if (proof) for (const [key, value] of Object.entries(proof)) if (value) form.append(key, value);
    form.append("file", await response.blob(), name);
    const res = await fetch(url, { method: "POST", headers, body: form });
    status = res.status;
    raw = await res.text();
  } else {
    // Native multipart upload avoids both URI-only FormData and unsupported Blob constructors.
    // File bytes stay on the native side, including for large audio files.
    const file = new File(fileUri);
    if (!file.exists) throw new Error("Le fichier sélectionné est introuvable. Sélectionne-le à nouveau.");
    const result = await file.upload(url, {
      httpMethod: "POST",
      uploadType: UploadType.MULTIPART,
      fieldName: "file",
      mimeType: mime,
      headers,
      sessionType: "foreground",
      parameters: proof,
    });
    status = result.status;
    raw = result.body;
  }

  let data: any = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { message: raw };
  }

  if (status < 200 || status >= 300) {
    throw new Error(data?.message ?? `Upload failed (${status})`);
  }

  if (!data?.file || typeof data.file.url !== "string" || !data.file.url) {
    throw new Error("Le serveur n’a pas renvoyé l’adresse du fichier. Réessaie l’envoi.");
  }

  // attendu: { file: { url, filename, mimetype, size } }
  return data as {
    file: { url: string; filename: string; mimetype: string; size: number };
  };
}
