import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  blobObjectExists,
  isBlobStorageEnabled,
  putBlobObject,
  readBlobObject,
} from "@/lib/storage/blob";

const LC_DIR = join(process.cwd(), "data", "lc");
const LC_BLOB_PREFIX = "lc";

export function ensureLcDir() {
  if (!existsSync(LC_DIR)) {
    mkdirSync(LC_DIR, { recursive: true });
  }
}

export function lcPdfFileName(lcUid: string) {
  return `${lcUid}.pdf`;
}

export function lcPdfPath(lcUid: string) {
  return join(LC_DIR, lcPdfFileName(lcUid));
}

export function lcPdfBlobPath(lcUid: string) {
  return `${LC_BLOB_PREFIX}/${lcPdfFileName(lcUid)}`;
}

export async function writeLcPdf(lcUid: string, bytes: Uint8Array) {
  if (isBlobStorageEnabled()) {
    await putBlobObject(lcPdfBlobPath(lcUid), bytes, "application/pdf");
    return;
  }

  ensureLcDir();
  writeFileSync(lcPdfPath(lcUid), bytes);
}

export async function readLcPdf(lcUid: string): Promise<Buffer | null> {
  if (isBlobStorageEnabled()) {
    return readBlobObject(lcPdfBlobPath(lcUid));
  }

  const path = lcPdfPath(lcUid);
  if (!existsSync(path)) return null;
  return readFileSync(path);
}

export async function lcPdfExists(lcUid: string) {
  if (isBlobStorageEnabled()) {
    return blobObjectExists(lcPdfBlobPath(lcUid));
  }

  return existsSync(lcPdfPath(lcUid));
}
