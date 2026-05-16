/**
 * T3-C — Image Upload Hardening
 *
 * Drop-in middleware for any route that accepts image uploads.
 *
 * Enforces:
 *  - Max 10 MB per file
 *  - JPEG / PNG / WebP MIME type only
 *  - Converts every upload to WebP at 85% quality, max 1920×1080
 *
 * Usage:
 *   import { imageUpload, processImageUpload } from "./imageUpload";
 *
 *   router.post(
 *     "/units/:id/images",
 *     imageUpload.single("image"),
 *     processImageUpload,
 *     async (req, res) => {
 *       const webpBuffer = req.processedImage!;   // ready to upload to Supabase storage
 *     }
 *   );
 */

import multer from "multer";
import sharp from "sharp";
import type { Request, Response, NextFunction } from "express";

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const WEBP_QUALITY = 85;

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `نوع الملف غير مدعوم. يُسمح فقط بـ JPEG و PNG و WebP.`,
        ),
      );
    }
  },
});

declare global {
  namespace Express {
    interface Request {
      processedImage?: Buffer;
    }
  }
}

/**
 * Run after multer — converts the uploaded buffer to WebP and attaches it to
 * req.processedImage.  Rejects with 400 if the buffer is missing or corrupt.
 */
export async function processImageUpload(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const file = req.file;
  if (!file) {
    res.status(400).json({ ok: false, error: { code: "NO_IMAGE", message: "لم يتم تحميل أي صورة" } });
    return;
  }

  try {
    req.processedImage = await sharp(file.buffer)
      .resize(MAX_WIDTH, MAX_HEIGHT, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    next();
  } catch {
    res.status(400).json({
      ok: false,
      error: { code: "IMAGE_PROCESSING_FAILED", message: "فشل معالجة الصورة. تأكد من أنها ملف صورة صالح." },
    });
  }
}
