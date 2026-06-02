import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CONTRACTS_DIR = join(process.cwd(), "data", "contracts");

export function ensureContractsDir() {
  if (!existsSync(CONTRACTS_DIR)) {
    mkdirSync(CONTRACTS_DIR, { recursive: true });
  }
}

export function contractPdfFileName(contractUid: string) {
  return `${contractUid}.pdf`;
}

export function contractPdfPath(contractUid: string) {
  return join(CONTRACTS_DIR, contractPdfFileName(contractUid));
}

export function writeContractPdf(contractUid: string, bytes: Uint8Array) {
  ensureContractsDir();
  writeFileSync(contractPdfPath(contractUid), bytes);
}

export function readContractPdf(contractUid: string): Buffer | null {
  const path = contractPdfPath(contractUid);
  if (!existsSync(path)) return null;
  return readFileSync(path);
}

export function contractPdfExists(contractUid: string) {
  return existsSync(contractPdfPath(contractUid));
}
