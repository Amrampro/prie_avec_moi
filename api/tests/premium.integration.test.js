import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import jwt from "jsonwebtoken";

const testUrl = process.env.PREMIUM_TEST_DATABASE_URL;
let prisma, app, server, base, prefix, users, free, premium, series, audioFile;
const tokens = {};
const uploadedFiles = [];
before(async () => {
  if (!testUrl) return;
  const url = new URL(testUrl);
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname) && url.pathname.includes("premium_test"), "Use an isolated local premium_test database.");
  process.env.DATABASE_URL = testUrl;
  process.env.JWT_SECRET = "premium-integration-only";
  ({ prisma } = await import("../src/config/prisma.js"));
  const { createApp } = await import("../src/app.js");
  const { uploadsDirectory } = await import("../src/modules/meditations/meditation.audio.js");
  prefix = `test-${randomUUID()}`;
  audioFile = path.join(uploadsDirectory, `${prefix}.mp3`);
  await writeFile(audioFile, "private audio fixture");
  users = {};
  for (const role of ["free", "premium", "expired", "other", "admin"]) {
    users[role] = await prisma.user.create({ data: { fullName: role, email: `${prefix}-${role}@example.test`, passwordHash: "test", isAdmin: role === "admin", premiumEndAt: role === "premium" ? new Date(Date.now() + 86400000) : role === "expired" ? new Date(0) : null } });
    tokens[role] = jwt.sign({ userId: users[role].id, isAdmin: role === "admin" }, process.env.JWT_SECRET);
  }
  series = await prisma.series.create({ data: { title: "Test", slug: prefix, isPublished: true } });
  free = await prisma.meditation.create({ data: { title: "Free", slug: `${prefix}-free`, bodyText: "free content", isPublished: true } });
  premium = await prisma.meditation.create({ data: { title: "Premium", slug: `${prefix}-premium`, bodyText: "private body", footerText: "private footer", audioUrl: `http://localhost/uploads/${prefix}.mp3`, isPremium: true, isPublished: true } });
  app = createApp();
  server = await new Promise(resolve => { const instance = app.listen(0, "127.0.0.1", () => resolve(instance)); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (!prisma) return;
  if (server) await new Promise(resolve => server.close(resolve));
  if (users) {
    const ids = Object.values(users).map(u => u.id);
    await prisma.premiumActivation.deleteMany({ where: { userId: { in: ids } } });
    await prisma.premiumCode.deleteMany({ where: { code: { startsWith: prefix.toUpperCase() } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await prisma.meditation.deleteMany({ where: { slug: { startsWith: prefix } } });
    if (series) await prisma.series.delete({ where: { id: series.id } });
  }
  if (audioFile) await unlink(audioFile);
  for (const file of uploadedFiles) await unlink(file);
  await prisma.$disconnect();
});
async function request(route, role, method = "GET", body) {
  const response = await fetch(`${base}${route}`, { method, headers: { "Content-Type": "application/json", ...(role ? { Authorization: `Bearer ${tokens[role]}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: response.status, data, headers: response.headers };
}
async function code(extra = {}) {
  return prisma.premiumCode.create({ data: { code: `${prefix}-${randomUUID()}`.toUpperCase().slice(0, 80), duration: 30, durationUnit: "DAYS", ...extra } });
}
function integration(name, fn) { test(name, { skip: !testUrl }, fn); }

integration("HTTP: free/anonymous access to free content; Premium access enforced", async () => {
  for (const role of [undefined, "free"]) assert.equal((await request(`/api/meditations/${free.slug}`, role)).status, 200);
  for (const role of [undefined, "free", "expired"]) {
    const response = await request(`/api/meditations/${premium.slug}`, role);
    assert.equal(response.status, 403); assert.equal(response.data.code, "PREMIUM_REQUIRED");
  }
  const response = await request(`/api/meditations/${premium.slug}`, "premium");
  assert.equal(response.status, 200); assert.equal(response.data.meditation.bodyText, "private body");
  assert.equal(response.data.meditation.audioUrl, `/meditations/${premium.slug}/audio`);
});
integration("HTTP: daily, standalone, series and favorites do not leak Premium content", async () => {
  const daily = await request("/api/meditations/daily");
  assert.equal(daily.data.meditation.isLocked, true);
  for (const key of ["bodyText", "footerText", "audioUrl"]) assert.equal(key in daily.data.meditation, false);
  const list = await request("/api/meditations/standalone");
  const item = list.data.meditations.find(m => m.id === premium.id);
  for (const key of ["bodyText", "footerText", "audioUrl"]) assert.equal(key in item, false);
  await prisma.meditation.update({ where: { id: premium.id }, data: { seriesId: series.id } });
  const detail = await request(`/api/series/${series.slug}`);
  assert.equal(detail.data.series.meditations[0].isPremium, true);
  assert.equal("audioUrl" in detail.data.series.meditations[0], false);
  await request(`/api/favorites/${premium.id}`, "free", "POST");
  const favorites = await request("/api/favorites", "free");
  assert.equal(favorites.data.favorites[0].meditation.isPremium, true);
  assert.equal("bodyText" in favorites.data.favorites[0].meditation, false);
});
integration("HTTP: audio protected through both direct upload and meditation route", async () => {
  for (const route of [`/uploads/${prefix}.mp3`, `/api/meditations/${premium.slug}/audio`]) {
    for (const role of [undefined, "free", "expired"]) assert.equal((await request(route, role)).status, 403);
    const response = await request(route, "premium");
    assert.equal(response.status, 200); assert.equal(response.data, "private audio fixture");
    assert.match(response.headers.get("cache-control"), /no-store/);
  }
  const head = await request(`/uploads/${prefix}.mp3`, undefined, "HEAD");
  assert.equal(head.status, 403);
  const encoded = await request(`/uploads/%74${prefix.slice(1)}.mp3`);
  assert.equal(encoded.status, 403);
  assert.equal((await request(`/uploads/${prefix}.mp3.`)).status, 404);
  const range = await fetch(`${base}/api/meditations/${premium.slug}/audio`, { headers: { Authorization: `Bearer ${tokens.premium}`, Range: "bytes=0-6" } });
  assert.equal(range.status, 206); assert.equal(await range.text(), "private");
  await prisma.meditation.update({ where: { id: free.id }, data: { audioUrl: premium.audioUrl } });
  assert.equal((await request(`/api/meditations/${free.slug}/audio`)).status, 403);
  await prisma.meditation.update({ where: { id: free.id }, data: { audioUrl: null } });
});
integration("HTTP: activation validates authentication and every invalid code state", async () => {
  assert.equal((await request("/api/premium/activate", undefined, "POST", { code: "NOT-FOUND" })).status, 401);
  for (const [entry, expected] of [[{ code: "NOT-FOUND" }, "INVALID_CODE"], [await code({ status: "USED", usedAt: new Date() }), "CODE_USED"], [await code({ expiresAt: new Date(0) }), "CODE_EXPIRED"], [await code({ status: "DISABLED" }), "CODE_DISABLED"]]) {
    const response = await request("/api/premium/activate", "free", "POST", { code: entry.code });
    assert.equal(response.status, 400); assert.equal(response.data.code, expected);
  }
});
integration("HTTP: valid code activates, records history, cannot be reused", async () => {
  const entry = await code();
  const response = await request("/api/premium/activate", "free", "POST", { code: ` ${entry.code.toLowerCase()} ` });
  assert.equal(response.status, 200); assert.equal(response.data.isPremium, true);
  assert.equal(new Date(response.data.premiumEndAt) - new Date(response.data.premiumStartAt), 30 * 86400000);
  const stored = await prisma.premiumCode.findUnique({ where: { id: entry.id }, include: { activation: true } });
  assert.equal(stored.usedById, users.free.id); assert.equal(stored.status, "USED"); assert.ok(stored.activation);
  assert.equal((await request("/api/premium/activate", "other", "POST", { code: entry.code })).data.code, "CODE_USED");
  assert.equal((await request("/api/account/me", "free")).data.user.isPremium, true);
});
integration("SQL: active subscription extends; expired subscription starts now", async () => {
  const { premiumService } = await import("../src/modules/premium/premium.service.js");
  const entry = await code();
  const result = await premiumService.activate(users.premium.id, { code: entry.code });
  assert.equal(result.premiumEndAt.getTime(), users.premium.premiumEndAt.getTime() + 30 * 86400000);
  const before = Date.now();
  const expired = await premiumService.activate(users.expired.id, { code: (await code()).code });
  assert.ok(expired.premiumStartAt.getTime() >= before);
});
integration("SQL concurrency: one code, two users, exactly one activation", async () => {
  const { premiumService } = await import("../src/modules/premium/premium.service.js");
  const entry = await code();
  const results = await Promise.allSettled([users.free.id, users.other.id].map(id => premiumService.activate(id, { code: entry.code })));
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  assert.equal(results.find(r => r.status === "rejected").reason.code, "CODE_USED");
  assert.equal(await prisma.premiumActivation.count({ where: { premiumCodeId: entry.id } }), 1);
});
integration("SQL concurrency: different codes on one user preserve both durations", async () => {
  const { premiumService } = await import("../src/modules/premium/premium.service.js");
  const before = await prisma.user.findUnique({ where: { id: users.premium.id } });
  const entries = await Promise.all([code(), code()]);
  await Promise.all(entries.map(entry => premiumService.activate(users.premium.id, { code: entry.code })));
  const after = await prisma.user.findUnique({ where: { id: users.premium.id } });
  assert.equal(after.premiumEndAt - before.premiumEndAt, 60 * 86400000);
});
integration("SQL: failure while writing history rolls back account and code", async () => {
  const { createPremiumService } = await import("../src/modules/premium/premium.service.js");
  const entry = await code();
  const before = await prisma.user.findUnique({ where: { id: users.premium.id } });
  const service = createPremiumService({ $transaction: (callback, options) => prisma.$transaction(tx => callback(new Proxy(tx, {
    get(target, key) { return key === "premiumActivation" ? { create() { throw new Error("History write failed"); } } : target[key]; },
  })), options) });
  await assert.rejects(service.activate(users.premium.id, { code: entry.code }), /History write failed/);
  const after = await prisma.user.findUnique({ where: { id: users.premium.id } });
  assert.equal(after.premiumEndAt.getTime(), before.premiumEndAt.getTime());
  assert.equal((await prisma.premiumCode.findUnique({ where: { id: entry.id } })).status, "AVAILABLE");
});
integration("HTTP: administration restricted; creation, uniqueness, disable and access flag", async () => {
  assert.equal((await request("/api/admin/premium-codes", "free")).status, 403);
  assert.equal((await request("/api/admin/premium-codes")).status, 401);
  const value = `${prefix}-MANUAL`.toUpperCase();
  const body = { code: value, duration: 3, durationUnit: "MONTHS" };
  const created = await request("/api/admin/premium-codes", "admin", "POST", body);
  assert.equal(created.status, 201);
  assert.equal((await request("/api/admin/premium-codes", "admin", "POST", body)).status, 409);
  assert.equal((await request(`/api/admin/premium-codes/${created.data.code.id}`, "admin", "PATCH", { status: "DISABLED" })).status, 200);
  assert.equal((await request("/api/premium/activate", "other", "POST", { code: value })).data.code, "CODE_DISABLED");
  const updated = await request(`/api/admin/meditations/${free.id}`, "admin", "PATCH", { isPremium: true });
  assert.equal(updated.status, 200); assert.equal(updated.data.meditation.isPremium, true);
  const external = await request(`/api/admin/meditations/${free.id}`, "admin", "PATCH", { audioUrl: "https://example.org/public.mp3" });
  assert.equal(external.status, 400); assert.equal(external.data.code, "PRIVATE_AUDIO_REQUIRED");
  const list = await request("/api/admin/premium-codes", "admin");
  assert.ok(list.data.codes.some(c => c.usedBy?.id === users.free.id));
  const generated = await request("/api/admin/premium-codes", "admin", "POST", { duration: 1, durationUnit: "YEARS" });
  assert.equal(generated.status, 201);
  try { assert.match(generated.data.code.code, /^PRIE-(?:[A-F0-9]{4}-){7}[A-F0-9]{4}$/); }
  finally { await prisma.premiumCode.delete({ where: { id: generated.data.code.id } }); }
  const invalid = await request("/api/admin/premium-codes", "admin", "POST", { duration: -1 });
  assert.equal(invalid.status, 400);
});
integration("HTTP: private audio upload is admin-only and never exposed as a static file", async () => {
  const { privateAudioDirectory, privateAudioPrefix } = await import("../src/modules/meditations/meditation.audio.js");
  const form = () => {
    const data = new FormData();
    data.append("file", new Blob(["private imported audio"], { type: "audio/mpeg" }), "meditation.mp3");
    return data;
  };
  const forbidden = await fetch(`${base}/api/admin/uploads/premium-audio`, { method: "POST", headers: { Authorization: `Bearer ${tokens.free}` }, body: form() });
  assert.equal(forbidden.status, 403); await forbidden.text();
  const upload = await fetch(`${base}/api/admin/uploads/premium-audio`, { method: "POST", headers: { Authorization: `Bearer ${tokens.admin}` }, body: form() });
  assert.equal(upload.status, 201);
  const { file } = await upload.json();
  uploadedFiles.push(path.join(privateAudioDirectory, file.filename));
  assert.equal((await request(`/uploads/${file.filename}`)).status, 404);
  assert.equal((await request(`${privateAudioPrefix}${file.filename}`, "premium")).status, 404);
  const update = await request(`/api/admin/meditations/${premium.id}`, "admin", "PATCH", { audioUrl: file.url });
  assert.equal(update.status, 200);
  assert.equal((await request(`/api/meditations/${premium.slug}/audio`, "admin")).status, 403);
  const allowed = await request(`/api/meditations/${premium.slug}/audio`, "premium");
  assert.equal(allowed.status, 200); assert.equal(allowed.data, "private imported audio");
});
integration("HTTP: expired status updates immediately and guessing is limited", async () => {
  await prisma.user.update({ where: { id: users.premium.id }, data: { premiumEndAt: new Date(0) } });
  const status = await request("/api/premium/status", "premium");
  assert.equal(status.status, 200); assert.equal(status.data.isPremium, false);
  assert.equal((await request(`/api/meditations/${premium.slug}`, "premium")).status, 403);
  let response;
  for (let i = 0; i < 11; i++) response = await request("/api/premium/activate", "admin", "POST", { code: "NOT-FOUND" });
  assert.equal(response.status, 429);
});
