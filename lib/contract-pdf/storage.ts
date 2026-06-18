import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  blobObjectExists,
  isBlobStorageEnabled,
  putBlobObject,
  readBlobObject,
} from "@/lib/storage/blob";

const CONTRACTS_DIR = join(process.cwd(), "data", "contracts");
const CONTRACTS_BLOB_PREFIX = "contracts";

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

export function contractPdfBlobPath(contractUid: string) {
  return `${CONTRACTS_BLOB_PREFIX}/${contractPdfFileName(contractUid)}`;
}

export async function writeContractPdf(contractUid: string, bytes: Uint8Array) {
  if (isBlobStorageEnabled()) {
    await putBlobObject(contractPdfBlobPath(contractUid), bytes, "application/pdf");
    return;
  }

  ensureContractsDir();
  writeFileSync(contractPdfPath(contractUid), bytes);
}

export async function readContractPdf(contractUid: string): Promise<Buffer | null> {
  if (isBlobStorageEnabled()) {
    return readBlobObject(contractPdfBlobPath(contractUid));
  }

  const path = contractPdfPath(contractUid);
  if (!existsSync(path)) return null;
  return readFileSync(path);
}

export async function contractPdfExists(contractUid: string) {
  if (isBlobStorageEnabled()) {
    return blobObjectExists(contractPdfBlobPath(contractUid));
  }

  return existsSync(contractPdfPath(contractUid));
}
