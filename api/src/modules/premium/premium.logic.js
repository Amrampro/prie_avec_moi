export function premiumError(code, message, statusCode = 400) {
  return Object.assign(new Error(message), { code, statusCode });
}

export function isUserPremium(user, now = new Date()) {
  return Boolean(user?.premiumEndAt && new Date(user.premiumEndAt) > now);
}

export function premiumStatus(user, now = new Date()) {
  return { isPremium: isUserPremium(user, now), premiumStartAt: user?.premiumStartAt ?? null, premiumEndAt: user?.premiumEndAt ?? null };
}

export function addDuration(start, duration, unit) {
  const end = new Date(start);
  if (unit === "DAYS") end.setUTCDate(end.getUTCDate() + duration);
  else {
    const day = end.getUTCDate();
    end.setUTCDate(1);
    end.setUTCMonth(end.getUTCMonth() + duration * (unit === "YEARS" ? 12 : 1));
    const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
    end.setUTCDate(Math.min(day, lastDay));
  }
  return end;
}

export function assertAvailable(code, now) {
  if (!code) throw premiumError("INVALID_CODE", "Code invalide.");
  if (code.status === "USED" || code.usedAt) throw premiumError("CODE_USED", "Code déjà utilisé.");
  if (code.status === "DISABLED") throw premiumError("CODE_DISABLED", "Code désactivé.");
  if (code.status === "EXPIRED" || (code.expiresAt && code.expiresAt <= now)) throw premiumError("CODE_EXPIRED", "Code expiré.");
  const maxDuration = { DAYS: 3650, MONTHS: 120, YEARS: 10 }[code.durationUnit];
  if (code.status !== "AVAILABLE" || !Number.isInteger(code.duration) || code.duration < 1 || !maxDuration || code.duration > maxDuration) {
    throw premiumError("INVALID_CODE", "Code invalide.");
  }
}

export function assertMeditationAccess(meditation, user, now = new Date()) {
  if (meditation.isPremium && !isUserPremium(user, now)) {
    throw premiumError("PREMIUM_REQUIRED", "Cette méditation est réservée aux utilisateurs Premium.", 403);
  }
}

export function meditationPreview(meditation) {
  if (!meditation) return null;
  const { bodyText, footerText, audioUrl, ...preview } = meditation;
  return preview;
}
