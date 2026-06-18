import { NextResponse } from "next/server";
import {
  getBankPdfAssetsFromDb,
  patchBankPdfAssetsInDb,
} from "@/lib/pdf/bank-assets-server";
import {
  bankAssetFilename,
  deleteBankAssetFile,
  readBankAssetFile,
  writeBankAssetFile,
} from "@/lib/pdf/bank-assets-storage";
import type { BankPdfAssetType } from "@/lib/pdf/bank-assets-storage";

type RouteParams = {
  params: Promise<{ bankId: string; assetType: string }>;
};

const ASSET_TYPES = new Set<BankPdfAssetType>(["signature", "verifier-stamp"]);

function contentTypeForFilename(filename: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/png";
}

function resolveAssetFilename(
  bankId: string,
  assetType: BankPdfAssetType,
  pdfAssets?: ReturnType<typeof getBankPdfAssetsFromDb>,
) {
  if (assetType === "signature") return pdfAssets?.signatureFile;
  return pdfAssets?.verifierStampFile;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { bankId, assetType: rawType } = await params;
  if (!bankId?.trim() || !ASSET_TYPES.has(rawType as BankPdfAssetType)) {
    return NextResponse.json({ error: "Invalid asset request." }, { status: 400 });
  }

  const assetType = rawType as BankPdfAssetType;
  const pdfAssets = getBankPdfAssetsFromDb(bankId);
  const filename = resolveAssetFilename(bankId, assetType, pdfAssets);
  const bytes = await readBankAssetFile(bankId, filename);

  if (!bytes) {
    return NextResponse.json({ error: "Asset not uploaded yet." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": contentTypeForFilename(filename ?? `${assetType}.png`),
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request, { params }: RouteParams) {
  const { bankId, assetType: rawType } = await params;
  if (!bankId?.trim() || !ASSET_TYPES.has(rawType as BankPdfAssetType)) {
    return NextResponse.json({ error: "Invalid asset request." }, { status: 400 });
  }

  const assetType = rawType as BankPdfAssetType;
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image uploads are supported." },
      { status: 400 },
    );
  }

  const extension = file.type.split("/")[1] ?? "png";
  let filename: string;
  try {
    filename = bankAssetFilename(assetType, extension);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid file type." },
      { status: 400 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  await writeBankAssetFile(bankId, filename, bytes);

  const patch =
    assetType === "signature"
      ? { signatureFile: filename }
      : { verifierStampFile: filename };

  const bank = patchBankPdfAssetsInDb(bankId, patch);
  if (!bank) {
    return NextResponse.json({ error: "Bank not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    bankId,
    assetType,
    filename,
    pdfAssets: bank.pdfAssets ?? {},
    assetUrl: `/api/banks/${encodeURIComponent(bankId)}/pdf-assets/${assetType}`,
  });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { bankId, assetType: rawType } = await params;
  if (!bankId?.trim() || !ASSET_TYPES.has(rawType as BankPdfAssetType)) {
    return NextResponse.json({ error: "Invalid asset request." }, { status: 400 });
  }

  const assetType = rawType as BankPdfAssetType;
  const pdfAssets = getBankPdfAssetsFromDb(bankId);
  const filename = resolveAssetFilename(bankId, assetType, pdfAssets);
  const patch =
    assetType === "signature"
      ? { signatureFile: undefined }
      : { verifierStampFile: undefined };

  await deleteBankAssetFile(bankId, filename);

  const bank = patchBankPdfAssetsInDb(bankId, patch);
  if (!bank) {
    return NextResponse.json({ error: "Bank not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    bankId,
    assetType,
    pdfAssets: bank.pdfAssets ?? {},
  });
}
