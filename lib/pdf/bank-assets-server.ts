import "server-only";

import { readDatabase, writeCollection } from "@/lib/json-db/server";
import type { BankPdfAssets } from "@/lib/bank-db";

export function getBankPdfAssetsFromDb(bankId: string): BankPdfAssets | undefined {
  return readDatabase().banks.find((bank) => bank.id === bankId)?.pdfAssets;
}

export function patchBankPdfAssetsInDb(
  bankId: string,
  patch: Partial<BankPdfAssets>,
) {
  const db = readDatabase();
  const bank = db.banks.find((item) => item.id === bankId);
  if (!bank) return null;

  const banks = db.banks.map((item) => {
    if (item.id !== bankId) return item;
    return {
      ...item,
      pdfAssets: {
        ...item.pdfAssets,
        ...patch,
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };
  });

  writeCollection("banks", banks);
  return banks.find((item) => item.id === bankId) ?? null;
}
