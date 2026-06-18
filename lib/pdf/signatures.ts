import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { PDFDocument, PDFImage } from "pdf-lib";
import type { BankPdfAssets } from "@/lib/bank-db";
import {
  readBankAssetFile,
  resolveBankAssetFilename,
} from "@/lib/pdf/bank-assets-storage";

export type SignatureAssetKey = "bank-officer" | "buyer" | "seller";

const SIGNATURES_DIR = join(process.cwd(), "lib", "pdf", "assets", "signatures");
const STAMPS_DIR = join(process.cwd(), "lib", "pdf", "assets", "stamps");

const SIGNATURE_FILES: Record<SignatureAssetKey, string> = {
  "bank-officer": "bank-officer.png",
  buyer: "buyer-signature.png",
  seller: "seller-signature.png",
};

export type BankDocumentImages = {
  bankSignature: PDFImage;
  verifierStamp: PDFImage;
  buyerSignature: PDFImage;
  sellerSignature: PDFImage;
};

async function embedBytes(doc: PDFDocument, bytes: Buffer, filename: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return doc.embedJpg(bytes);
  }
  return doc.embedPng(bytes);
}

async function embedDefault(doc: PDFDocument, path: string) {
  const bytes = readFileSync(path);
  return doc.embedPng(bytes);
}

export async function loadSignatureImages(
  doc: PDFDocument,
): Promise<Record<SignatureAssetKey, PDFImage>> {
  const images = {} as Record<SignatureAssetKey, PDFImage>;

  for (const key of Object.keys(SIGNATURE_FILES) as SignatureAssetKey[]) {
    images[key] = await embedDefault(
      doc,
      join(SIGNATURES_DIR, SIGNATURE_FILES[key]),
    );
  }

  return images;
}

export async function loadVerifierStamp(doc: PDFDocument): Promise<PDFImage> {
  return embedDefault(doc, join(STAMPS_DIR, "verifier-stamp.png"));
}

export async function loadBankDocumentImages(
  doc: PDFDocument,
  bankId: string,
  pdfAssets?: BankPdfAssets,
): Promise<BankDocumentImages> {
  const defaults = await loadSignatureImages(doc);
  const defaultStamp = await loadVerifierStamp(doc);

  const signatureFile = await resolveBankAssetFilename(
    bankId,
    "signature",
    pdfAssets?.signatureFile,
  );
  const stampFile = await resolveBankAssetFilename(
    bankId,
    "verifier-stamp",
    pdfAssets?.verifierStampFile,
  );

  const signatureBytes = await readBankAssetFile(bankId, signatureFile ?? undefined);
  const stampBytes = await readBankAssetFile(bankId, stampFile ?? undefined);

  const bankSignature = signatureBytes
    ? await embedBytes(doc, signatureBytes, signatureFile ?? "signature.png")
    : defaults["bank-officer"];

  const verifierStamp = stampBytes
    ? await embedBytes(doc, stampBytes, stampFile ?? "verifier-stamp.png")
    : defaultStamp;

  return {
    bankSignature,
    verifierStamp,
    buyerSignature: defaults.buyer,
    sellerSignature: defaults.seller,
  };
}
