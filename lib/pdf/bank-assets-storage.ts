import "server-only";

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  deleteBlobObject,
  isBlobStorageEnabled,
  putBlobObject,
  readBlobObject,
} from "@/lib/storage/blob";

export type BankPdfAssetType = "signature" | "verifier-stamp";

const BANK_ASSETS_ROOT = join(process.cwd(), "data", "bank-assets");

const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

export function ensureBankAssetsDir(bankId: string) {
  const dir = join(BANK_ASSETS_ROOT, bankId);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function bankAssetFilename(type: BankPdfAssetType, extension: string) {
  const normalized = extension.toLowerCase().replace(/^\./, "");
  if (!ALLOWED_EXTENSIONS.has(normalized)) {
    throw new Error("Unsupported image type. Use PNG, JPG, or WEBP.");
  }
  return `${type}.${normalized === "jpeg" ? "jpg" : normalized}`;
}

export function bankAssetPath(bankId: string, filename: string) {
  return join(BANK_ASSETS_ROOT, bankId, filename);
}

export function bankAssetBlobPath(bankId: string, filename: string) {
  return `bank-assets/${bankId}/${filename}`;
}

export async function writeBankAssetFile(
  bankId: string,
  filename: string,
  bytes: Uint8Array,
) {
  if (isBlobStorageEnabled()) {
    await putBlobObject(
      bankAssetBlobPath(bankId, filename),
      bytes,
      contentTypeForFilename(filename),
    );
    return;
  }

  ensureBankAssetsDir(bankId);
  writeFileSync(bankAssetPath(bankId, filename), bytes);
}

export async function readBankAssetFile(
  bankId: string,
  filename?: string,
): Promise<Buffer | null> {
  if (!filename) return null;

  if (isBlobStorageEnabled()) {
    return readBlobObject(bankAssetBlobPath(bankId, filename));
  }

  const path = bankAssetPath(bankId, filename);
  if (!existsSync(path)) return null;
  return readFileSync(path);
}

export async function resolveBankAssetFilename(
  bankId: string,
  type: BankPdfAssetType,
  preferred?: string,
) {
  if (isBlobStorageEnabled()) {
    if (preferred && (await readBlobObject(bankAssetBlobPath(bankId, preferred)))) {
      return preferred;
    }

    for (const ext of ["png", "jpg", "webp"]) {
      const filename = `${type}.${ext}`;
      if (await readBlobObject(bankAssetBlobPath(bankId, filename))) return filename;
    }

    return null;
  }

  if (preferred) {
    const path = bankAssetPath(bankId, preferred);
    if (existsSync(path)) return preferred;
  }

  for (const ext of ["png", "jpg", "webp"]) {
    const filename = `${type}.${ext}`;
    if (existsSync(bankAssetPath(bankId, filename))) return filename;
  }

  return null;
}

export async function deleteBankAssetFile(bankId: string, filename?: string) {
  if (!filename) return;

  if (isBlobStorageEnabled()) {
    await deleteBlobObject(bankAssetBlobPath(bankId, filename));
    return;
  }

  const path = bankAssetPath(bankId, filename);
  if (existsSync(path)) {
    rmSync(path, { force: true });
  }
}

function contentTypeForFilename(filename: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/png";
}
