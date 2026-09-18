import path from "node:path";
import { fileURLToPath } from "node:url";
import { access } from "node:fs/promises";
import { prisma } from "../../config/prisma.js";
import { assertMeditationAccess, premiumError } from "../premium/premium.logic.js";

export const uploadsDirectory = fileURLToPath(new URL("../../../uploads/", import.meta.url));
export const privateAudioDirectory = fileURLToPath(new URL("../../../private-audio/", import.meta.url));
export const privateAudioPrefix = "/api/meditations/private-audio/";

export function localAudioFilename(url) {
  try {
    const parsed = new URL(url);
    if (parsed.search || parsed.hash) return null;
    const prefix = parsed.pathname.startsWith(privateAudioPrefix) ? privateAudioPrefix : "/uploads/";
    const name = decodeURIComponent(parsed.pathname.slice(prefix.length));
    if (parsed.pathname !== `${prefix}${name}` || !/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(name)) return null;
    return name;
  } catch { return null; }
}

export function isPrivateAudio(url) {
  try { return new URL(url).pathname.startsWith(privateAudioPrefix); } catch { return false; }
}

export function localAudioPath(url) {
  const filename = localAudioFilename(url);
  return filename ? path.join(isPrivateAudio(url) ? privateAudioDirectory : uploadsDirectory, filename) : null;
}

export async function validatePremiumAudio(meditation) {
  if (!meditation.isPremium || !meditation.audioUrl) return;
  const filename = localAudioFilename(meditation.audioUrl);
  if (!filename || !isPrivateAudio(meditation.audioUrl)) throw premiumError("PRIVATE_AUDIO_REQUIRED", "Pour une méditation Premium, importez à nouveau le fichier audio après avoir choisi Premium uniquement. Il sera stocké dans un espace privé.");
  try { await access(localAudioPath(meditation.audioUrl)); }
  catch { throw premiumError("AUDIO_NOT_FOUND", "Le fichier audio importé est introuvable."); }
}

// Run before express.static, including HEAD/range requests and encoded paths.
export async function assertUploadedAudioAccess(filename, userId) {
  const protectedAudio = await prisma.meditation.findFirst({
    where: { isPremium: true, audioUrl: { endsWith: `/${filename}` } },
    select: { isPremium: true },
  });
  if (protectedAudio) {
    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
    assertMeditationAccess(protectedAudio, user);
  }
}

export async function protectUploadedAudio(req, res, next) {
  res.set("Cache-Control", "private, no-store");
  let filename;
  try { filename = decodeURIComponent(req.path).replace(/^\/+/, ""); }
  catch { return res.sendStatus(400); }
  // Exclude filesystem aliases (Windows trailing dots, spaces, short names, ADS).
  if (!/^[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9]+)?$/.test(filename)) return res.sendStatus(404);
  await assertUploadedAudioAccess(filename, req.user?.id);
  next();
}
