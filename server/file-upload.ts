import path from "path";
import fs from "fs";
import crypto from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function isReplitEnvironment(): boolean {
  return !!process.env.PRIVATE_OBJECT_DIR;
}

function generateFileName(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString("hex");
  return `${timestamp}-${random}${ext}`;
}

export async function saveFile(
  buffer: Buffer,
  originalName: string,
  contentType: string
): Promise<{ url: string; fileName: string }> {
  ensureUploadDir();

  const fileName = generateFileName(originalName);
  const filePath = path.join(UPLOAD_DIR, fileName);

  await fs.promises.writeFile(filePath, buffer);

  return {
    url: `/api/files/${fileName}`,
    fileName,
  };
}

export async function getFile(
  fileName: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const filePath = path.join(UPLOAD_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const buffer = await fs.promises.readFile(filePath);
  const ext = path.extname(fileName).toLowerCase();

  const contentTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
  };

  return {
    buffer,
    contentType: contentTypes[ext] || "application/octet-stream",
  };
}

export async function deleteFile(fileName: string): Promise<boolean> {
  const filePath = path.join(UPLOAD_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    return false;
  }

  await fs.promises.unlink(filePath);
  return true;
}

export { isReplitEnvironment, UPLOAD_DIR };
