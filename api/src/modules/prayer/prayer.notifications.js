import nodemailer from "nodemailer";
import { randomUUID } from "node:crypto";
import { prisma } from "../../config/prisma.js";

export const statusMessages = {
  ENVOYEE: "Ta demande a bien été reçue.",
  EN_ETUDE: "Notre équipe examine ta requête.",
  PRECISION_DEMANDEE: "Nous avons besoin d’une information complémentaire.",
  EN_PREPARATION: "Ton programme est en préparation.",
  DISPONIBLE: "Ton programme personnalisé a été envoyé.",
  TERMINEE: "Ton programme est terminé.",
};

export async function notify(db, userId, type, message, resourceType, resourceId, key = randomUUID()) {
  return db.prayerNotification.upsert({
    where: { dedupeKey: key }, update: {},
    create: { userId, type, title: "Prie avec moi", message, resourceType, resourceId, dedupeKey: key },
  });
}

export function localClock(date, timezone = "UTC") {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const get = name => parts.find(p => p.type === name)?.value;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

let running = false;
let missingLogged = false;
export async function runPrayerReminders(now = new Date()) {
  if (running) return;
  running = true;
  try {
    const appointments = await prisma.prayerAppointment.findMany({ where: { closedAt: null, slot: { startsAt: { gt: now, lte: new Date(+now + 86400000) } } }, include: { slot: true, user: { select: { prayerPreferences: true } } } });
    for (const a of appointments) {
      if (a.user.prayerPreferences?.appointmentReminders === false) continue;
      const remaining = +a.slot.startsAt - +now;
      const window = remaining <= 1800000 ? "30m" : "24h";
      // A booking made inside the reminder window gets one reminder, never both together.
      await notify(prisma, a.userId, "APPOINTMENT_REMINDER", `Ton rendez-vous de prière est prévu le ${a.slot.startsAt.toLocaleString("fr-FR", { timeZone: a.timezone })} (${a.timezone}).`, "appointment", a.id, `appointment:${a.id}:${window}`);
    }
    const progress = await prisma.prayerProgress.findMany({ where: { program: { published: true } }, include: { user: { select: { prayerPreferences: true } }, program: { select: { days: true } } } });
    const reminded = new Set();
    for (const p of progress) {
      const prefs = p.user.prayerPreferences || {};
      if (prefs.programReminders === false || p.program.days.every(day => p.steps?.[`${day.id}:validation`]?.done)) continue;
      const clock = localClock(now, prefs.timezone || "UTC");
      for (const [period, time] of [["morning", prefs.morning || "07:00"], ["evening", prefs.evening || "20:00"]]) {
        const key = `daily:${p.userId}:${clock.date}:${period}`;
        // Catch up within the scheduled hour if the server was briefly unavailable.
        if (clock.time >= time && clock.time.slice(0, 2) === time.slice(0, 2) && !reminded.has(key)) {
          await notify(prisma, p.userId, "DAILY_REMINDER", "Ton temps de prière est prêt.", "program", p.programId, key);
          reminded.add(key);
        }
      }
    }
    const configured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM_EMAIL;
    if (!configured) {
      if (!missingLogged) console.warn("SMTP non configuré : les notifications internes restent actives.");
      missingLogged = true;
      return;
    }
    const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 465), secure: process.env.SMTP_SECURE !== "false", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }, connectionTimeout: 10000, socketTimeout: 15000 });
    const pending = await prisma.prayerNotification.findMany({ where: { emailSentAt: null, emailAttempts: { lt: 3 }, createdAt: { gte: new Date(+now - 86400000) } }, include: { user: { select: { email: true, prayerPreferences: true } } }, take: 30, orderBy: { createdAt: "asc" } });
    for (const n of pending) {
      if (n.user.prayerPreferences?.email === false) {
        await prisma.prayerNotification.update({ where: { id: n.id }, data: { emailAttempts: 3 } });
        continue;
      }
      // Claim before sending so parallel server instances do not send the same email.
      const claimed = await prisma.prayerNotification.updateMany({ where: { id: n.id, emailAttempts: n.emailAttempts, emailSentAt: null }, data: { emailAttempts: { increment: 1 }, emailSentAt: now } });
      if (!claimed.count) continue;
      try {
        await transport.sendMail({ from: { name: process.env.SMTP_FROM_NAME || "Prie avec moi", address: process.env.SMTP_FROM_EMAIL }, to: n.user.email, subject: n.title, text: `${n.message}\n\nConsulte l’application pour les détails de ton suivi.` });
      } catch (error) {
        await prisma.prayerNotification.update({ where: { id: n.id }, data: { emailSentAt: null } });
        console.warn("Envoi SMTP indisponible", error.code || "SMTP_ERROR");
      }
    }
    transport.close();
  } finally { running = false; }
}

export function startPrayerReminders() {
  const tick = () => runPrayerReminders().catch(error => console.warn("Rappels indisponibles", error.code || error.name));
  tick();
  const timer = setInterval(tick, 60000);
  timer.unref();
  return timer;
}
