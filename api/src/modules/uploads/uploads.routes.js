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
