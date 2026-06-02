import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LC_DIR = join(process.cwd(), "data", "lc");

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

export function writeLcPdf(lcUid: string, bytes: Uint8Array) {
  ensureLcDir();
  writeFileSync(lcPdfPath(lcUid), bytes);
}

export function readLcPdf(lcUid: string): Buffer | null {
  const path = lcPdfPath(lcUid);
  if (!existsSync(path)) return null;
  return readFileSync(path);
}

export function lcPdfExists(lcUid: string) {
  return existsSync(lcPdfPath(lcUid));
}
