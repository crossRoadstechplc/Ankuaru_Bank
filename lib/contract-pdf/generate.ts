import { readDatabase, writeCollection } from "@/lib/json-db/server";
import type { BankPdfContext } from "@/lib/bank-pdf-assets-client";
import type { TradeContractRecord } from "@/lib/bank-operations-db";
import { buildContractPdf } from "./build";
import {
  contractPdfFileName,
  contractPdfExists,
  readContractPdf,
  writeContractPdf,
} from "./storage";

export function findTradeContract(contractUid: string): TradeContractRecord | undefined {
  const db = readDatabase();
  return db.tradeContracts.find((contract) => contract.contractUid === contractUid);
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

export async function generateAndStoreContractPdf(
  contractUid: string,
  contractFallback?: TradeContractRecord,
) {
  let contract = findTradeContract(contractUid);
  if (!contract && contractFallback) {
    const db = readDatabase();
    const contracts = [...db.tradeContracts];
    const index = contracts.findIndex(
      (item) => item.contractUid === contractFallback.contractUid,
    );
    if (index >= 0) contracts[index] = contractFallback;
    else contracts.unshift(contractFallback);
    writeCollection("tradeContracts", contracts);
    contract = contractFallback;
  }
  if (!contract) return null;

  const bank = resolveBankPdfContext(contract.bankId);
  const pdfBytes = await buildContractPdf(contract, bank);
  await writeContractPdf(contractUid, pdfBytes);

  const pdfPath = contractPdfFileName(contractUid);
  const db = readDatabase();
  const contracts = db.tradeContracts.map((item) =>
    item.contractUid === contractUid ? { ...item, pdfPath } : item,
  );
  writeCollection("tradeContracts", contracts);

  return {
    contract: { ...contract, pdfPath },
    pdfBytes,
  };
}

export async function getContractPdf(contractUid: string) {
  if (await contractPdfExists(contractUid)) {
    return readContractPdf(contractUid);
  }

  const result = await generateAndStoreContractPdf(contractUid);
  if (!result) return null;
  return Buffer.from(result.pdfBytes);
}
