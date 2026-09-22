import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { prisma } from "../../config/prisma.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/async.handler.js";
import { notify, statusMessages } from "./prayer.notifications.js";

export const prayerRoutes = Router();
const fail = (message, statusCode = 400) => { throw Object.assign(new Error(message), { statusCode }); };
export const isAdmin = u => u.isAdmin || u.role === "ADMINISTRATEUR";
export const isStaff = u => isAdmin(u) || u.role === "ACCOMPAGNATEUR";
export const canManageRequest = (u, r) => isAdmin(u) || (u.role === "ACCOMPAGNATEUR" && r.companionId === u.id);
const staff = req => { if (!isStaff(req.actor)) fail("Accès réservé à l’équipe.", 403); };
const admin = req => { if (!isAdmin(req.actor)) fail("Accès réservé à l’administration.", 403); };
const text = z.string().trim().min(1).max(20000);
const short = z.string().trim().min(1).max(190);
export const timezoneSchema = z.string().max(80).refine(value => { try { new Intl.DateTimeFormat("fr", { timeZone: value }); return true; } catch { return false; } }, "Fuseau horaire invalide.");
const userSelect = { id: true, fullName: true };
export const requestSchema = z.object({ category: short, text, country: short, timezone: timezoneSchema, followUp: z.enum(["ECRIT", "VISIO"]), consent: z.literal(true) }).strict();
const daySchema = z.object({ id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/), title: short, orientation: z.string().max(20000).default(""), personalRequest: z.string().max(20000).default(""), scriptures: z.string().max(20000).default(""), prayer: z.string().max(20000).default(""), proclamations: z.string().max(20000).default(""), commitment: z.string().max(20000).default(""), actions: z.string().max(20000).default(""), preparation: z.string().max(20000).default(""), audioUrl: z.string().url().or(z.literal("")).default("") }).strict();
const programSchema = z.object({ title: short, description: z.string().max(20000).default(""), kind: z.enum(["PUBLIC", "PERSONNEL", "MODELE"]), requestId: z.string().nullable().default(null), published: z.boolean().default(false), days: z.array(daySchema).min(1).max(366).refine(days => new Set(days.map(d => d.id)).size === days.length, "Identifiants de journées dupliqués.") }).strict();
const preferencesSchema = z.object({ language: z.enum(["fr", "en"]).default("fr"), timezone: timezoneSchema, programReminders: z.boolean(), appointmentReminders: z.boolean(), email: z.boolean(), morning: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), evening: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/) }).strict();

prayerRoutes.use(authMiddleware, asyncHandler(async (req, res, next) => {
  req.actor = await prisma.user.findUnique({ where: { id: req.user.id }, select: { ...userSelect, isAdmin: true, role: true, prayerPreferences: true } });
  if (!req.actor) fail("Connecte-toi à nouveau.", 401);
  next();
}));
const route = (method, path, handler) => prayerRoutes[method](path, asyncHandler(async (req, res) => res.json(await handler(req))));
async function getRequest(req, id, manage = false) {
  const r = await prisma.prayerRequest.findUnique({ where: { id } });
  if (!r || !(canManageRequest(req.actor, r) || (!manage && r.userId === req.actor.id))) fail("Demande introuvable.", 404);
  return r;
}
export async function getProgram(req, id, manage = false) {
  const p = await prisma.prayerProgram.findUnique({ where: { id }, include: { request: true } });
  if (!p) fail("Programme introuvable.", 404);
  const editor = isAdmin(req.actor) || (isStaff(req.actor) && (p.kind === "PERSONNEL" ? p.request && canManageRequest(req.actor, p.request) : p.authorId === req.actor.id || p.kind === "MODELE"));
  const reader = p.published && (p.kind === "PUBLIC" || (p.kind === "PERSONNEL" && p.request?.userId === req.actor.id));
  if (manage ? !editor : !(editor || reader)) fail("Programme introuvable.", 404);
  return p;
}
async function companion(id) {
  if (!id) return;
  const u = await prisma.user.findUnique({ where: { id }, select: { isAdmin: true, role: true } });
  if (!u || !isStaff(u)) fail("Accompagnateur invalide.");
}

route("get", "/me", async req => ({ role: isAdmin(req.actor) ? "ADMINISTRATEUR" : req.actor.role, preferences: req.actor.prayerPreferences || { language: "fr", timezone: "UTC", programReminders: true, appointmentReminders: true, email: true, morning: "07:00", evening: "20:00" } }));
route("patch", "/me", async req => {
  const preferences = preferencesSchema.parse(req.body);
  await prisma.user.update({ where: { id: req.actor.id }, data: { prayerPreferences: preferences } });
  return { preferences };
});
route("get", "/requests", async req => {
  const where = req.query.team === "true" && isStaff(req.actor) ? (isAdmin(req.actor) ? {} : { companionId: req.actor.id }) : { userId: req.actor.id };
  if (req.query.status) where.status = z.enum(Object.keys(statusMessages)).parse(req.query.status);
  if (req.query.category) where.category = { contains: short.parse(req.query.category) };
  if (req.query.companionId && isAdmin(req.actor)) where.companionId = String(req.query.companionId);
  if (req.query.date) { const date = z.coerce.date().parse(req.query.date); where.createdAt = { gte: date, lt: new Date(+date + 86400000) }; }
  return { requests: await prisma.prayerRequest.findMany({ where, include: { user: { select: userSelect } }, orderBy: { createdAt: "desc" }, take: 200 }) };
});
route("post", "/requests", async req => {
  const { consent, ...data } = requestSchema.parse(req.body);
  return prisma.$transaction(async db => {
    const request = await db.prayerRequest.create({ data: { ...data, userId: req.actor.id } });
    await notify(db, req.actor.id, "REQUEST_RECEIVED", statusMessages.ENVOYEE, "request", request.id);
    return { request };
  });
});
route("get", "/requests/:id", async req => {
  const request = await getRequest(req, req.params.id);
  const progress = await prisma.prayerProgress.findMany({ where: { userId: request.userId, program: { requestId: request.id } }, include: { program: { select: { title: true, days: true } } } });
  const appointment = await prisma.prayerAppointment.findUnique({ where: { requestId: request.id }, include: { slot: true } });
  return { request, appointment, advancement: progress.map(p => ({ title: p.program.title, days: p.program.days.length, completed: p.program.days.filter(d => p.steps?.[`${d.id}:validation`]?.done).length })) };
});
route("delete", "/requests/:id", async req => {
  const r = await getRequest(req, req.params.id);
  if (r.userId !== req.actor.id && !isAdmin(req.actor)) fail("Action non autorisée.", 403);
  await prisma.prayerRequest.delete({ where: { id: r.id } });
  return { ok: true };
});
route("patch", "/requests/:id", async req => {
  const r = await getRequest(req, req.params.id);
  if (!canManageRequest(req.actor, r)) {
    const data = z.object({ reply: text }).strict().parse(req.body);
    if (r.status !== "PRECISION_DEMANDEE") fail("Aucune précision demandée.");
    return { request: await prisma.prayerRequest.update({ where: { id: r.id }, data: { ...data, status: "EN_ETUDE" } }) };
  }
  const data = z.object({ status: z.enum(Object.keys(statusMessages)).optional(), companionId: z.string().nullable().optional(), clarification: z.string().max(20000).optional() }).strict().parse(req.body);
  if (data.companionId !== undefined) { admin(req); await companion(data.companionId); }
  if (data.status === "DISPONIBLE" && !(await prisma.prayerProgram.count({ where: { requestId: r.id, published: true } }))) fail("Publie d’abord un programme personnel.");
  return prisma.$transaction(async db => {
    const request = await db.prayerRequest.update({ where: { id: r.id }, data });
    if (data.status && data.status !== r.status) await notify(db, r.userId, data.status, statusMessages[data.status], "request", r.id);
    return { request };
  });
});

route("get", "/programs", async req => {
  const team = req.query.team === "true" && isStaff(req.actor);
  const where = team ? (isAdmin(req.actor) ? {} : { OR: [{ kind: "MODELE" }, { authorId: req.actor.id, kind: { not: "PERSONNEL" } }, { request: { companionId: req.actor.id } }] }) : { published: true, OR: [{ kind: "PUBLIC" }, { kind: "PERSONNEL", request: { userId: req.actor.id } }] };
  const programs = await prisma.prayerProgram.findMany({ where, select: { id: true, title: true, description: true, kind: true, published: true, requestId: true, updatedAt: true }, orderBy: { updatedAt: "desc" } });
  const progress = await prisma.prayerProgress.findMany({ where: { userId: req.actor.id, programId: { in: programs.map(p => p.id) } }, orderBy: { updatedAt: "desc" } });
  return { programs, progress };
});
route("get", "/programs/:id", async req => {
  const p = await getProgram(req, req.params.id);
  const { request, ...program } = p;
  return { program, progress: await prisma.prayerProgress.findUnique({ where: { userId_programId: { userId: req.actor.id, programId: p.id } } }) };
});
async function saveProgram(req, id) {
  staff(req);
  if (id) await getProgram(req, id, true);
  const data = programSchema.parse(req.body);
  if (data.kind === "PERSONNEL") {
    if (!data.requestId) fail("Choisis une demande.");
    await getRequest(req, data.requestId, true);
  } else data.requestId = null;
  if (data.kind === "MODELE") data.published = false;
  return prisma.$transaction(async db => {
    const program = id ? await db.prayerProgram.update({ where: { id }, data }) : await db.prayerProgram.create({ data: { ...data, authorId: req.actor.id } });
    if (program.published && program.requestId) {
      const r = await db.prayerRequest.update({ where: { id: program.requestId }, data: { status: "DISPONIBLE" } });
      await notify(db, r.userId, "PROGRAM_AVAILABLE", statusMessages.DISPONIBLE, "program", program.id, `program:${program.id}:available`);
    }
    return { program };
  });
}
route("post", "/programs", req => saveProgram(req));
route("patch", "/programs/:id", req => saveProgram(req, req.params.id));
route("post", "/programs/:id/duplicate", async req => {
  staff(req);
  const p = await getProgram(req, req.params.id, true);
  const data = z.object({ requestId: z.string().optional(), dayId: z.string().optional() }).strict().parse(req.body);
  if (data.dayId) {
    const day = p.days.find(d => d.id === data.dayId);
    if (!day || p.days.length >= 366) fail("Journée invalide.");
    return { program: await prisma.prayerProgram.update({ where: { id: p.id }, data: { days: [...p.days, { ...day, id: randomUUID(), title: `${day.title} (copie)` }] } }) };
  }
  if (data.requestId) await getRequest(req, data.requestId, true);
  const duplicateId = randomUUID();
  return { program: await prisma.prayerProgram.create({ data: { id: duplicateId, title: `${p.title} (copie)`, description: p.description, kind: data.requestId ? "PERSONNEL" : p.kind === "PERSONNEL" ? "MODELE" : p.kind, requestId: data.requestId || null, authorId: req.actor.id, days: p.days.map(d => ({ ...d, id: randomUUID(), audioUrl: d.audioUrl?.replace(`/prayer-audio/${p.id}/`, `/prayer-audio/${duplicateId}/`) || "" })), published: false } }) };
});

export function mergeSteps(previous, incoming) {
  const result = { ...previous };
  for (const [key, value] of Object.entries(incoming)) if (!result[key] || value.at > result[key].at) result[key] = value;
  return result;
}
route("patch", "/programs/:id/progress", async req => {
  const p = await getProgram(req, req.params.id);
  const data = z.object({ steps: z.record(z.object({ done: z.boolean(), at: z.number().int().min(0).max(Date.now() + 300000) })).default({}), position: z.string().max(200).optional(), positionAt: z.number().int().min(0).max(Date.now() + 300000).optional() }).strict().parse(req.body);
  const fields = ["orientation", "personalRequest", "scriptures", "prayer", "proclamations", "commitment", "actions", "validation", "preparation"];
  const valid = new Set(p.days.flatMap(d => fields.map(f => `${d.id}:${f}`)));
  if (Object.keys(data.steps).some(k => !valid.has(k)) || (data.position && !p.days.some(d => d.id === data.position))) fail("Étape invalide.");
  const progress = await prisma.$transaction(async db => {
    const where = { userId_programId: { userId: req.actor.id, programId: p.id } };
    await db.prayerProgress.upsert({ where, update: {}, create: { userId: req.actor.id, programId: p.id, steps: {} } });
    // Lock this user's row before merging concurrent updates from different devices.
    await db.$queryRaw`SELECT id FROM prayer_progress WHERE userId = ${req.actor.id} AND programId = ${p.id} FOR UPDATE`;
    const previous = await db.prayerProgress.findUnique({ where });
    const position = data.position && data.positionAt > +(previous.positionAt || 0) ? { position: data.position, positionAt: new Date(data.positionAt) } : {};
    return db.prayerProgress.update({ where, data: { steps: mergeSteps(previous.steps, data.steps), ...position } });
  });
  return { progress };
});

route("get", "/slots", async req => ({ slots: await prisma.prayerSlot.findMany({ where: { active: true, startsAt: { gt: new Date() }, appointment: null }, orderBy: { startsAt: "asc" }, take: 200 }) }));
route("post", "/slots", async req => {
  staff(req);
  const data = z.object({ startsAt: z.coerce.date().refine(d => d > new Date(), "Date passée."), duration: z.number().int().min(5).max(240), timezone: timezoneSchema, contribution: z.string().max(190).optional() }).strict().parse(req.body);
  return { slot: await prisma.prayerSlot.create({ data: { ...data, creatorId: req.actor.id } }) };
});
route("delete", "/slots/:id", async req => {
  staff(req);
  const slot = await prisma.prayerSlot.findUnique({ where: { id: req.params.id }, include: { appointment: true } });
  if (!slot || (!isAdmin(req.actor) && slot.creatorId !== req.actor.id)) fail("Créneau introuvable.", 404);
  if (slot.appointment) fail("Ce créneau est réservé.", 409);
  await prisma.prayerSlot.update({ where: { id: slot.id }, data: { active: false } });
  return { ok: true };
});
route("get", "/appointments", async req => {
  const where = req.query.team === "true" && isStaff(req.actor) ? (isAdmin(req.actor) ? {} : { companionId: req.actor.id }) : { userId: req.actor.id };
  return { appointments: await prisma.prayerAppointment.findMany({ where, include: { slot: true, user: { select: userSelect } }, orderBy: { slot: { startsAt: "asc" } }, take: 200 }) };
});
route("post", "/appointments", async req => {
  const data = z.object({ requestId: short, slotId: short, timezone: timezoneSchema }).strict().parse(req.body);
  const r = await getRequest(req, data.requestId);
  if (r.userId !== req.actor.id || r.followUp !== "VISIO") fail("Demande de visioconférence requise.");
  try {
    return await prisma.$transaction(async db => {
      await db.$queryRaw`SELECT id FROM prayer_slot WHERE id = ${data.slotId} FOR UPDATE`;
      const slot = await db.prayerSlot.findUnique({ where: { id: data.slotId } });
      if (!slot || !slot.active || slot.startsAt <= new Date()) fail("Créneau indisponible.", 409);
      const appointment = await db.prayerAppointment.create({ data: { ...data, userId: req.actor.id } });
      await notify(db, req.actor.id, "APPOINTMENT_CONFIRMED", "Ton rendez-vous de prière est confirmé.", "appointment", appointment.id);
      return { appointment };
    });
  } catch (e) { if (e.code === "P2002") fail("Un rendez-vous existe déjà pour cette demande ou ce créneau. Consulte Mon suivi ou choisis un autre créneau.", 409); throw e; }
});
route("patch", "/appointments/:id", async req => {
  staff(req);
  const a = await prisma.prayerAppointment.findUnique({ where: { id: req.params.id } });
  if (!a || (!isAdmin(req.actor) && a.companionId !== req.actor.id)) fail("Rendez-vous introuvable.", 404);
  const data = z.object({ companionId: z.string().nullable().optional(), zoomUrl: z.string().url().refine(url => { const u = new URL(url); return u.protocol === "https:" && (u.hostname === "zoom.us" || u.hostname.endsWith(".zoom.us")); }, "Lien Zoom HTTPS requis.").optional(), close: z.boolean().optional() }).strict().parse(req.body);
  if (data.companionId !== undefined || data.zoomUrl !== undefined) admin(req);
  await companion(data.companionId);
  const { close, ...update } = data;
  return prisma.$transaction(async db => {
    const appointment = await db.prayerAppointment.update({ where: { id: a.id }, data: { ...update, ...(close ? { closedAt: new Date() } : {}) } });
    if (data.companionId) await db.prayerRequest.update({ where: { id: a.requestId }, data: { companionId: data.companionId } });
    if (data.zoomUrl) await notify(db, a.userId, "APPOINTMENT_LINK", "Le lien de ton rendez-vous est disponible dans Mon suivi.", "appointment", a.id);
    return { appointment };
  });
});

const methodSchema = z.object({ name: short, type: short, holder: short, account: short, bank: z.string().max(190).default(""), iban: z.string().max(190).default(""), swift: z.string().max(190).default(""), currency: z.string().length(3), instructions: z.string().max(5000).default(""), active: z.boolean(), displayOrder: z.number().int().min(0).max(10000) }).strict();
route("get", "/methods", async req => ({ methods: await prisma.contributionMethod.findMany({ where: isAdmin(req.actor) && req.query.team === "true" ? {} : { active: true }, orderBy: { displayOrder: "asc" } }) }));
route("post", "/methods", async req => { admin(req); return { method: await prisma.contributionMethod.create({ data: methodSchema.parse(req.body) }) }; });
route("patch", "/methods/:id", async req => { admin(req); return { method: await prisma.contributionMethod.update({ where: { id: req.params.id }, data: methodSchema.partial().parse(req.body) }) }; });
route("get", "/proofs", async req => ({ proofs: await prisma.contributionProof.findMany({ where: isAdmin(req.actor) && req.query.team === "true" ? {} : { userId: req.actor.id }, select: { id: true, user: { select: userSelect }, method: true, amount: true, currency: true, reference: true, mime: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 200 }) }));
route("patch", "/proofs/:id", async req => {
  admin(req);
  const data = z.object({ status: z.enum(["RECUE", "VERIFIEE", "REFUSEE"]) }).strict().parse(req.body);
  // Administrative annotation only. Never modify requests, appointments, access or Premium here.
  await prisma.contributionProof.update({ where: { id: req.params.id }, data });
  return { ok: true };
});
route("get", "/notifications", async req => ({ notifications: await prisma.prayerNotification.findMany({ where: { userId: req.actor.id }, orderBy: { createdAt: "desc" }, take: 100 }), unread: await prisma.prayerNotification.count({ where: { userId: req.actor.id, readAt: null } }) }));
route("get", "/notifications/:id", async req => {
  const notification = await prisma.prayerNotification.findFirst({ where: { id: req.params.id, userId: req.actor.id } });
  if (!notification) fail("Notification introuvable.", 404);
  return { notification };
});
route("patch", "/notifications/:id", async req => {
  await prisma.prayerNotification.updateMany({ where: { id: req.params.id, userId: req.actor.id, readAt: null }, data: { readAt: new Date() } });
  return { ok: true };
});
route("get", "/testimonies", async req => ({ testimonies: await prisma.prayerTestimony.findMany({ where: req.query.published === "true" ? { published: true, consent: true } : isAdmin(req.actor) && req.query.team === "true" ? {} : { userId: req.actor.id }, ...(req.query.published === "true" ? { select: { id: true, text: true, createdAt: true } } : {}), orderBy: { createdAt: "desc" }, take: 200 }) }));
route("post", "/testimonies", async req => ({ testimony: await prisma.prayerTestimony.create({ data: { ...z.object({ text, consent: z.boolean() }).strict().parse(req.body), userId: req.actor.id } }) }));
route("patch", "/testimonies/:id", async req => {
  const t = await prisma.prayerTestimony.findUnique({ where: { id: req.params.id } });
  if (!t || (!isAdmin(req.actor) && t.userId !== req.actor.id)) fail("Témoignage introuvable.", 404);
  if (req.body.published !== undefined) {
    admin(req);
    const { published } = z.object({ published: z.boolean() }).strict().parse(req.body);
    if (published && !t.consent) fail("Consentement de l’auteur requis.");
    await prisma.prayerTestimony.update({ where: { id: t.id }, data: { published } });
  } else {
    if (t.userId !== req.actor.id) fail("Seul l’auteur peut donner son consentement.", 403);
    const { consent } = z.object({ consent: z.boolean() }).strict().parse(req.body);
    await prisma.prayerTestimony.update({ where: { id: t.id }, data: { consent, ...(!consent ? { published: false } : {}) } });
  }
  return { ok: true };
});
route("get", "/team", async req => { staff(req); return { users: await prisma.user.findMany({ where: { OR: [{ isAdmin: true }, { role: { in: ["ADMINISTRATEUR", "ACCOMPAGNATEUR"] } }] }, select: { ...userSelect, role: true } }) }; });
