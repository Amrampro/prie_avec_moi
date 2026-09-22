import AsyncStorage from "@react-native-async-storage/async-storage";
import { File, Directory, Paths } from "expo-file-system";
import { Platform } from "react-native";
import { apiRequest } from "./api.client";
import { useAuthStore } from "../stores/auth.store";
import { API_BASE_URL } from "../constants/api";

export function prayerAudioHeaders(uri: string) {
  // Never forward the session token to an external audio host.
  return uri.startsWith(`${API_BASE_URL}/admin/uploads/prayer-audio/`) ? { Authorization: `Bearer ${useAuthStore.getState().token}` } : undefined;
}

export const prayerApi = (path: string, method: "GET" | "POST" | "PATCH" | "DELETE" = "GET", body?: unknown) => apiRequest<any>(method, `/prayer${path}`, body, { auth: true });
export const dayFields = [
  ["orientation", "Orientation"], ["personalRequest", "Requête personnelle"], ["scriptures", "Textes bibliques"], ["prayer", "Sujets de prière"], ["proclamations", "Proclamations"], ["commitment", "Parole d’engagement"], ["actions", "Actions concrètes"], ["validation", "Validation de la journée"], ["preparation", "Préparation du lendemain"],
];
const prefix = () => `prayer:${useAuthStore.getState().user?.id || "guest"}:`;
let writes: Promise<any> = Promise.resolve();
function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const next = writes.then(fn, fn);
  writes = next.catch(() => {});
  return next;
}
export async function cachedPrograms() {
  const value = await AsyncStorage.getItem(prefix() + "catalog");
  const data = value ? JSON.parse(value) : { programs: [], progress: [] };
  const progress = new Map<string, any>(data.progress.map((p: any) => [p.programId, p]));
  for (const p of data.programs) {
    const cached = JSON.parse(await AsyncStorage.getItem(prefix() + p.id) || "null");
    if (cached?.progress) progress.set(p.id, { ...cached.progress, programId: p.id });
  }
  data.progress = [...progress.values()].sort((a, b) => +(new Date(b.positionAt || b.updatedAt || 0)) - +(new Date(a.positionAt || a.updatedAt || 0)));
  return data;
}
export async function listPrograms() {
  const key = prefix();
  try {
    const data = await prayerApi("/programs");
    if (key === prefix()) await AsyncStorage.setItem(key + "catalog", JSON.stringify(data));
    return data;
  } catch (error: any) {
    if (error.status) throw error;
    return cachedPrograms();
  }
}
export async function loadProgram(id: string) {
  const scope = prefix();
  const key = scope + id;
  const cached = JSON.parse(await AsyncStorage.getItem(key) || "null");
  try {
    const data = await prayerApi(`/programs/${id}`);
    return await serialized(async () => {
      if (scope !== prefix()) throw new Error("La session a changé.");
      const pending = JSON.parse(await AsyncStorage.getItem(scope + "pending") || "{}")[id];
      if (pending) {
        const steps = { ...data.progress?.steps };
        for (const [key, value] of Object.entries(pending.steps || {}) as [string, any][]) if (!steps[key] || value.at > steps[key].at) steps[key] = value;
        const position = pending.positionAt > +(new Date(data.progress?.positionAt || 0)) ? { position: pending.position, positionAt: pending.positionAt } : {};
        data.progress = { ...data.progress, ...position, steps };
      }
      if (cached?.audio) data.audio = Object.fromEntries(data.program.days.filter((d: any) => cached.program.days.some((old: any) => old.id === d.id && old.audioUrl === d.audioUrl)).map((d: any) => [d.id, cached.audio[d.id]]).filter(([, uri]: any) => !!uri));
      data.downloaded = !!cached?.downloaded;
      await AsyncStorage.setItem(key, JSON.stringify(data));
      return data;
    });
  } catch (error: any) {
    if (error.status === 403 || error.status === 404) { await AsyncStorage.removeItem(key); throw error; }
    if (scope !== prefix() || error.status || !cached) throw error;
    return { ...cached, offline: true };
  }
}
export async function downloadProgram(id: string) {
  const key = prefix();
  const data = await loadProgram(id);
  const audio: Record<string, string> = {};
  if (Platform.OS !== "web") {
    const directory = new Directory(Paths.document, "prayer", useAuthStore.getState().user!.id);
    directory.create({ intermediates: true, idempotent: true });
    for (const day of data.program.days) if (day.audioUrl) {
      const extension = new URL(day.audioUrl).pathname.match(/\.(mp3|m4a|aac|wav|ogg|opus|flac|mp4)$/i)?.[0] || ".mp3";
      const destination = new File(directory, `${id}-${day.id}${extension}`);
      const local = await File.downloadFileAsync(day.audioUrl, destination, { idempotent: true, headers: prayerAudioHeaders(day.audioUrl) });
      audio[day.id] = local.uri;
    }
  } else if (data.program.days.some((d: any) => d.audioUrl)) {
    throw new Error("Le téléchargement audio hors ligne est disponible dans l’application mobile.");
  }
  if (key !== prefix()) throw new Error("La session a changé.");
  await serialized(async () => {
    const current = JSON.parse(await AsyncStorage.getItem(key + id) || "{}");
    await AsyncStorage.setItem(key + id, JSON.stringify({ ...data, ...current, audio, downloaded: true }));
  });
  return { ...data, audio, downloaded: true };
}
export function saveProgress(id: string, change: any) {
  const key = prefix();
  return serialized(async () => {
    if (key !== prefix()) return;
    const pending = JSON.parse(await AsyncStorage.getItem(key + "pending") || "{}");
    const cached = JSON.parse(await AsyncStorage.getItem(key + id) || "{}");
    const progress = { ...cached.progress, ...change, steps: { ...cached.progress?.steps, ...change.steps } };
    pending[id] = { ...pending[id], ...change, steps: { ...pending[id]?.steps, ...change.steps } };
    await AsyncStorage.multiSet([[key + "pending", JSON.stringify(pending)], [key + id, JSON.stringify({ ...cached, progress })]]);
    return progress;
  });
}
export function syncPrayerProgress() {
  const key = prefix();
  if (!useAuthStore.getState().token) return Promise.resolve();
  return serialized(async () => {
    const pending = JSON.parse(await AsyncStorage.getItem(key + "pending") || "{}");
    for (const [id, progress] of Object.entries(pending)) {
      if (key !== prefix()) return;
      try {
        const result = await prayerApi(`/programs/${id}/progress`, "PATCH", progress);
        const cached = JSON.parse(await AsyncStorage.getItem(key + id) || "{}");
        await AsyncStorage.setItem(key + id, JSON.stringify({ ...cached, progress: result.progress }));
        delete pending[id];
        await AsyncStorage.setItem(key + "pending", JSON.stringify(pending));
      } catch (error: any) {
        if (error.status === 403 || error.status === 404) {
          delete pending[id];
          await AsyncStorage.removeItem(key + id);
          await AsyncStorage.setItem(key + "pending", JSON.stringify(pending));
          continue;
        }
        return;
      }
    }
  });
}
export async function clearPrayerCache(userId: string) {
  await writes;
  const keys = (await AsyncStorage.getAllKeys()).filter(k => k.startsWith(`prayer:${userId}:`));
  await AsyncStorage.multiRemove(keys);
  if (Platform.OS !== "web") {
    const dir = new Directory(Paths.document, "prayer", userId);
    if (dir.exists) dir.delete();
  }
}

export function removeRequestCache(requestId: string) {
  const scope = prefix();
  return serialized(async () => {
    const pending = JSON.parse(await AsyncStorage.getItem(scope + "pending") || "{}");
    for (const key of (await AsyncStorage.getAllKeys()).filter(k => k.startsWith(scope))) {
      const cached = JSON.parse(await AsyncStorage.getItem(key) || "null");
      if (cached?.program?.requestId !== requestId) continue;
      if (Platform.OS !== "web") {
        const directory = new Directory(Paths.document, "prayer", useAuthStore.getState().user!.id);
        for (const uri of Object.values(cached.audio || {}) as string[]) if (uri.startsWith(directory.uri + "/")) { const file = new File(uri); if (file.exists) file.delete(); }
      }
      delete pending[cached.program.id];
      await AsyncStorage.removeItem(key);
    }
    await AsyncStorage.setItem(scope + "pending", JSON.stringify(pending));
    const catalog = JSON.parse(await AsyncStorage.getItem(scope + "catalog") || "null");
    if (catalog) { catalog.programs = catalog.programs.filter((p: any) => p.requestId !== requestId); catalog.progress = catalog.progress.filter((p: any) => catalog.programs.some((c: any) => c.id === p.programId)); await AsyncStorage.setItem(scope + "catalog", JSON.stringify(catalog)); }
  });
}
