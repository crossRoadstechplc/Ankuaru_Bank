import { readDatabase, writeCollection } from "@/lib/json-db/server";
import type { BankPdfContext } from "@/lib/bank-pdf-assets-client";
import type { LetterOfCreditRecord } from "@/lib/bank-operations-db";
import { buildLcPdf } from "./build";
import { lcPdfFileName, lcPdfExists, readLcPdf, writeLcPdf } from "./storage";

export function findLetterOfCredit(lcUid: string): LetterOfCreditRecord | undefined {
  const db = readDatabase();
  return db.lettersOfCredit.find((lc) => lc.lcUid === lcUid);
}

function resolveBankPdfContext(bankId: string): BankPdfContext {
  const bank = readDatabase().banks.find((item) => item.id === bankId);
  return {
    bankId,
    bankDisplayName: bank?.displayName ?? "Participating Bank",
    signatoryName: bank?.pdfAssets?.signatoryName?.trim() || "Authorized Signatory",
    pdfAssets: bank?.pdfAssets,
  };
}

export async function generateAndStoreLcPdf(
  lcUid: string,
  lcFallback?: LetterOfCreditRecord,
) {
  let lc = findLetterOfCredit(lcUid);
  if (!lc && lcFallback) {
    const db = readDatabase();
    const lettersOfCredit = [...db.lettersOfCredit];
    const index = lettersOfCredit.findIndex(
      (item) => item.lcUid === lcFallback.lcUid,
    );
    if (index >= 0) lettersOfCredit[index] = lcFallback;
    else lettersOfCredit.unshift(lcFallback);
    writeCollection("lettersOfCredit", lettersOfCredit);
    lc = lcFallback;
  }
  if (!lc) return null;

  const bank = resolveBankPdfContext(lc.bankId);
  const pdfBytes = await buildLcPdf(lc, bank);
  writeLcPdf(lcUid, pdfBytes);

  const pdfPath = lcPdfFileName(lcUid);
  const db = readDatabase();
  const lettersOfCredit = db.lettersOfCredit.map((item) =>
    item.lcUid === lcUid ? { ...item, pdfPath } : item,
  );
  writeCollection("lettersOfCredit", lettersOfCredit);

  return {
    lc: { ...lc, pdfPath },
    pdfBytes,
  };
}

export async function getLcPdf(lcUid: string) {
  if (lcPdfExists(lcUid)) {
    return readLcPdf(lcUid);
  }

  const result = await generateAndStoreLcPdf(lcUid);
  if (!result) return null;
  return Buffer.from(result.pdfBytes);
}
