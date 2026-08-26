import "server-only";

import { put, del } from "@vercel/blob";
import sharp from "sharp";

/**
 * Photograph uploads.
 *
 * Every image the product stores passes through here, and it is re-encoded on
 * the way rather than merely checked. Re-encoding is what actually strips EXIF
 * — a header check does not, and a photograph filed as proof of where somebody
 * was should not carry the coordinates of where they live in its metadata. It
 * is also what makes the type claim true: a file renamed to `.jpg` does not
 * survive being decoded and written back out as one.
 *
 * The original is never kept. There is no product surface that wants a 12MP
 * original, and keeping one would mean keeping the metadata this exists to
 * remove.
 */

/** The longest edge we store. Proof photos are read at card size, not printed. */
const MAX_EDGE = 1600;
const MAX_BYTES = 12 * 1024 * 1024;

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export type UploadResult =
  | { ok: true; url: string; width: number; height: number; bytes: number }
  | { ok: false; message: string };

export function uploadsEnabled(): boolean {
  return (process.env.BLOB_READ_WRITE_TOKEN ?? "").length > 0;
}

export async function storePhoto(file: File, prefix: string): Promise<UploadResult> {
  if (!ALLOWED.has(file.type)) {
    return { ok: false, message: "That has to be a JPEG, PNG, WebP or HEIC." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: "That photograph is over 12 MB." };
  }
  if (!uploadsEnabled()) {
    return {
      ok: false,
      message: "Photo storage is not configured on this deployment (BLOB_READ_WRITE_TOKEN).",
    };
  }

  const input = Buffer.from(await file.arrayBuffer());

  let output: Buffer;
  let width: number;
  let height: number;
  try {
    const pipeline = sharp(input, { failOn: "error" })
      // `rotate()` with no argument bakes the EXIF orientation into the pixels
      // before the metadata goes, so a portrait photo does not come back
      // sideways once its orientation tag has been dropped.
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true });

    const result = await pipeline.toBuffer({ resolveWithObject: true });
    output = result.data;
    width = result.info.width;
    height = result.info.height;
  } catch {
    return { ok: false, message: "That file could not be read as an image." };
  }

  const blob = await put(`${prefix}/${crypto.randomUUID()}.jpg`, output, {
    access: "public",
    contentType: "image/jpeg",
    addRandomSuffix: false,
  });

  return { ok: true, url: blob.url, width, height, bytes: output.byteLength };
}

/** Remove a stored photograph. Silent when the blob has already gone. */
export async function removePhoto(url: string): Promise<void> {
  if (!uploadsEnabled()) return;
  try {
    await del(url);
  } catch {
    /* a photo that is already gone is the state we wanted */
  }
}
