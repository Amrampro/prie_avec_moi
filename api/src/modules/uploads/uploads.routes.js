import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { adminMiddleware } from "../../middlewares/admin.middleware.js";
import { randomBytes } from "node:crypto";
import { asyncHandler } from "../../utils/async.handler.js";
import { prisma } from "../../config/prisma.js";
import { z } from "zod";
import { notify } from "../prayer/prayer.notifications.js";
import { getProgram } from "../prayer/prayer.routes.js";
import { privateAudioDirectory, privateAudioPrefix } from "../meditations/meditation.audio.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ uploads à la racine de /api
const uploadDir = path.resolve(process.cwd(), "uploads");

// ✅ crée le dossier si absent
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const safe = `${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`;
    cb(null, safe);
  },
});

const upload = multer({ storage });

export const uploadRoutes = Router();

// Outside the public uploads tree: a proof can only be downloaded through this authorized route.
const proofDir = path.resolve(__dirname, "../../../private-uploads/proofs");
export async function removeProofFiles(filenames) {
  for (const filename of filenames) {
    if (!/^[a-f0-9]{48}\.(jpe?g|png|pdf)$/.test(filename)) continue;
    await fs.promises.unlink(path.join(proofDir, filename)).catch(error => {
      if (error.code !== "ENOENT") console.warn("Suppression de preuve différée", error.code);
    });
  }
}
const proofUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) { fs.mkdir(proofDir, { recursive: true }, error => cb(error, proofDir)); },
    filename(req, file, cb) { cb(null, `${randomBytes(24).toString("hex")}${path.extname(file.originalname).toLowerCase()}`); },
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 4 },
  fileFilter(req, file, cb) {
    const valid = /\.(jpe?g|png|pdf)$/i.test(file.originalname) && ["image/jpeg", "image/png", "application/pdf"].includes(file.mimetype);
    cb(valid ? null : Object.assign(new Error("Formats autorisés : JPG, PNG, PDF (10 Mo maximum)."), { statusCode: 400 }), valid);
  },
});
uploadRoutes.post("/proof", authMiddleware, (req, res, next) => proofUpload.single("file")(req, res, error => {
  if (error) { error.statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400; return next(error); }
  next();
}), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Aucun fichier envoyé." });
  try {
    const data = z.object({ methodId: z.string().optional(), amount: z.string().regex(/^\d{1,10}(\.\d{1,2})?$/).optional(), currency: z.string().length(3).optional(), reference: z.string().max(190).optional() }).strict().parse(req.body);
    const handle = await fs.promises.open(req.file.path, "r");
    const signature = Buffer.alloc(8);
    try { await handle.read(signature, 0, 8, 0); } finally { await handle.close(); }
    const mime = signature.subarray(0, 3).equals(Buffer.from([255, 216, 255])) ? "image/jpeg" : signature.equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? "image/png" : signature.subarray(0, 5).toString() === "%PDF-" ? "application/pdf" : null;
    if (mime !== req.file.mimetype) throw Object.assign(new Error("Le contenu ne correspond pas au format annoncé."), { statusCode: 400 });
    if (data.methodId && !(await prisma.contributionMethod.findFirst({ where: { id: data.methodId, active: true } }))) throw Object.assign(new Error("Moyen de contribution indisponible."), { statusCode: 400 });
    const proof = await prisma.$transaction(async db => {
      const proof = await db.contributionProof.create({ data: { ...data, userId: req.user.id, filename: req.file.filename, mime } });
      await notify(db, req.user.id, "PROOF_RECEIVED", "Ta preuve de contribution a été reçue. Elle ne modifie pas ton suivi.", "proof", proof.id);
      return proof;
    });
    res.status(201).json({ file: { url: `/admin/uploads/proof/${proof.id}`, filename: req.file.filename, mimetype: mime, size: req.file.size } });
  } catch (error) { await fs.promises.unlink(req.file.path).catch(() => {}); throw error; }
}));
uploadRoutes.get("/proof/:id", authMiddleware, asyncHandler(async (req, res) => {
  const [proof, user] = await Promise.all([
    prisma.contributionProof.findUnique({ where: { id: req.params.id } }),
    prisma.user.findUnique({ where: { id: req.user.id }, select: { isAdmin: true, role: true } }),
  ]);
  if (!proof || !user || (proof.userId !== req.user.id && !user.isAdmin && user.role !== "ADMINISTRATEUR")) return res.status(404).json({ message: "Preuve introuvable." });
  res.set({ "Cache-Control": "private, no-store", "Content-Type": proof.mime, "X-Content-Type-Options": "nosniff" });
  res.sendFile(path.join(proofDir, proof.filename));
}));

const privateUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) { fs.mkdir(privateAudioDirectory, { recursive: true }, error => cb(error, privateAudioDirectory)); },
    filename(req, file, cb) { cb(null, `${randomBytes(24).toString("hex")}${path.extname(file.originalname).toLowerCase()}`); },
  }),
  limits: { fileSize: 100 * 1024 * 1024, files: 1 },
  fileFilter(req, file, cb) {
    const valid = /\.(mp3|m4a|aac|wav|ogg|opus|flac|mp4)$/i.test(file.originalname);
    cb(valid ? null : Object.assign(new Error("Format audio non pris en charge."), { statusCode: 400 }), valid);
  },
});

const prayerAudioDir = path.resolve(__dirname, "../../../private-uploads/prayer-audio");
const prayerAudioUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) { fs.mkdir(prayerAudioDir, { recursive: true }, error => cb(error, prayerAudioDir)); },
    filename(req, file, cb) { cb(null, `${randomBytes(24).toString("hex")}${path.extname(file.originalname).toLowerCase()}`); },
  }),
  limits: { fileSize: 100 * 1024 * 1024, files: 1 },
  fileFilter(req, file, cb) {
    const valid = /\.(mp3|m4a|aac|wav|ogg|opus|flac|mp4)$/i.test(file.originalname);
    cb(valid ? null : Object.assign(new Error("Format audio non pris en charge."), { statusCode: 400 }), valid);
  },
});
async function authorizePrayerAudio(req, res, next) {
  req.actor = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, isAdmin: true, role: true } });
  if (!req.actor) return res.status(401).json({ message: "Unauthenticated" });
  req.program = await getProgram(req, req.params.programId, req.method === "POST");
  next();
}
uploadRoutes.post("/prayer-audio/:programId", authMiddleware, asyncHandler(authorizePrayerAudio), (req, res, next) => prayerAudioUpload.single("file")(req, res, error => {
  if (error) { error.statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400; return next(error); }
  if (!req.file) return res.status(400).json({ message: "Aucun audio envoyé." });
  const base = (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
  res.status(201).json({ file: { url: `${base}/api/admin/uploads/prayer-audio/${req.params.programId}/${req.file.filename}`, filename: req.file.filename, mimetype: req.file.mimetype, size: req.file.size } });
}));
uploadRoutes.get("/prayer-audio/:programId/:filename", authMiddleware, asyncHandler(authorizePrayerAudio), (req, res) => {
  if (!/^[a-f0-9]{48}\.(mp3|m4a|aac|wav|ogg|opus|flac|mp4)$/.test(req.params.filename)) return res.sendStatus(404);
  const suffix = `/prayer-audio/${req.params.programId}/${req.params.filename}`;
  if (!req.program.days.some(day => day.audioUrl?.endsWith(suffix))) return res.sendStatus(404);
  res.set("Cache-Control", "private, no-store");
  res.sendFile(path.join(prayerAudioDir, req.params.filename));
});

uploadRoutes.post("/premium-audio", authMiddleware, asyncHandler(async (req, res, next) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { isAdmin: true } });
  if (!user?.isAdmin) return res.status(403).json({ message: "Forbidden (admin only)" });
  next();
}), (req, res, next) => privateUpload.single("file")(req, res, error => {
  if (error) { error.statusCode ??= error.code === "LIMIT_FILE_SIZE" ? 413 : 400; return next(error); }
  if (!req.file) return res.status(400).json({ message: "Aucun fichier audio envoyé." });
  const baseUrl = (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
  res.status(201).json({ file: { filename: req.file.filename, mimetype: req.file.mimetype, size: req.file.size, url: `${baseUrl}${privateAudioPrefix}${req.file.filename}` } });
}));

uploadRoutes.post(
  "/",
  authMiddleware,
  // adminMiddleware,
  upload.single("file"),
  (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    const baseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
    const url = `${baseUrl}/uploads/${req.file.filename}`;

    return res.status(201).json({
      file: {
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url,
      },
    });
  }
);
