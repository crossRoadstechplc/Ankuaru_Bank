import type { BankPdfAssets } from "@/lib/bank-db";

export type BankPdfContext = {
  bankId: string;
  bankDisplayName: string;
  signatoryName: string;
  pdfAssets?: BankPdfAssets;
};

export function bankPdfAssetUrl(
  bankId: string,
  assetType: "signature" | "verifier-stamp",
) {
  return `/api/banks/${encodeURIComponent(bankId)}/pdf-assets/${assetType}`;
}

export async function uploadBankPdfAsset(
  bankId: string,
  assetType: "signature" | "verifier-stamp",
  file: File,
) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `/api/banks/${encodeURIComponent(bankId)}/pdf-assets/${assetType}`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to upload document asset.");
  }

  return (await response.json()) as {
    ok: true;
    pdfAssets: BankPdfAssets;
    assetUrl: string;
  };
}

export async function saveBankSignatoryName(bankId: string, signatoryName: string) {
  const response = await fetch(
    `/api/banks/${encodeURIComponent(bankId)}/pdf-assets`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signatoryName }),
    },
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to save signatory name.");
  }

  return (await response.json()) as { ok: true; pdfAssets: BankPdfAssets };
}

export function previewBankPdfAssetUrl(
  bankId: string,
  assetType: "signature" | "verifier-stamp",
  cacheKey?: string,
) {
  const base = bankPdfAssetUrl(bankId, assetType);
  return cacheKey ? `${base}?v=${encodeURIComponent(cacheKey)}` : base;
}
