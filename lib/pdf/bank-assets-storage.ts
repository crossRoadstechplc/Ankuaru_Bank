import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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

export function writeBankAssetFile(
  bankId: string,
  filename: string,
  bytes: Uint8Array,
) {
  ensureBankAssetsDir(bankId);
  writeFileSync(bankAssetPath(bankId, filename), bytes);
}

export function readBankAssetFile(
  bankId: string,
  filename?: string,
): Buffer | null {
  if (!filename) return null;
  const path = bankAssetPath(bankId, filename);
  if (!existsSync(path)) return null;
  return readFileSync(path);
}

export function resolveBankAssetFilename(
  bankId: string,
  type: BankPdfAssetType,
  preferred?: string,
) {
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
