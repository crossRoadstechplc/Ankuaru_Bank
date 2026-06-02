import {
  ApiEnvironment,
  BankApiCredential,
  getBank,
  listBanks,
  updateBankCredentials,
} from "./bank-db";
import {
  findClientByName,
  type ClientAccountRecord,
} from "./bank-tenant-db";
import { dbGet, dbSet, persistCollection } from "@/lib/json-db/client";

export type CredentialScopes = {
  lcIssue: boolean;
  guaranteeRead: boolean;
  settlementRelease: boolean;
  kycVerify: boolean;
  riskExposure: boolean;
};

export type CredentialRequestInput = {
  bankId: string;
  environment: ApiEnvironment;
  clientIdPrefix: string;
  expiry: string;
  scopes: CredentialScopes;
};

export type CredentialListItem = BankApiCredential & {
  bankId: string;
  bankName: string;
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `cred-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function writeBankCredentials(
  bankId: string,
  credentials: BankApiCredential[],
) {
  updateBankCredentials(bankId, credentials);
}

function scopesToString(scopes: CredentialScopes) {
  const parts: string[] = [];
  if (scopes.lcIssue) parts.push("lc:issue");
  if (scopes.guaranteeRead) parts.push("guarantee:read");
  if (scopes.settlementRelease) parts.push("settlement:release");
  if (scopes.kycVerify) parts.push("kyc:verify");
  if (scopes.riskExposure) parts.push("risk:exposure");
  return parts.join(", ") || "lc:issue";
}

export function listAllBankCredentials(): CredentialListItem[] {
  return listBanks().flatMap((bank) =>
    bank.credentials.map((credential) => ({
      ...credential,
      bankId: bank.id,
      bankName: bank.displayName,
    })),
  );
}

export function generateBankCredential(
  input: CredentialRequestInput,
): { credential?: CredentialListItem; errors?: string[] } {
  const bank = getBank(input.bankId);
  if (!bank) return { errors: ["Bank not found."] };
  if (!input.clientIdPrefix.trim()) {
    return { errors: ["Client ID prefix is required."] };
  }

  const suffix = Math.random().toString(36).slice(2, 6);
  const credential: BankApiCredential = {
    id: createId(),
    clientId: `${input.clientIdPrefix.trim()}-${input.environment}-${suffix}`,
    environment: input.environment,
    scopes: scopesToString(input.scopes),
    status: input.environment === "production" ? "active" : "sandbox",
    createdAt: new Date().toISOString(),
  };

  writeBankCredentials(bank.id, [...bank.credentials, credential]);
  return {
    credential: {
      ...credential,
      bankId: bank.id,
      bankName: bank.displayName,
    },
  };
}

export function promoteBankCredential(
  bankId: string,
  credentialId: string,
): { credential?: CredentialListItem; errors?: string[] } {
  const bank = getBank(bankId);
  if (!bank) return { errors: ["Bank not found."] };

  const credential = bank.credentials.find((item) => item.id === credentialId);
  if (!credential) return { errors: ["Credential not found."] };

  const promoted: BankApiCredential = {
    ...credential,
    environment: "production",
    status: "active",
  };
  writeBankCredentials(
    bankId,
    bank.credentials.map((item) =>
      item.id === credentialId ? promoted : item,
    ),
  );

  return {
    credential: {
      ...promoted,
      bankId: bank.id,
      bankName: bank.displayName,
    },
  };
}

export function rotateBankCredential(
  bankId: string,
  credentialId: string,
): { credential?: CredentialListItem; errors?: string[] } {
  const bank = getBank(bankId);
  if (!bank) return { errors: ["Bank not found."] };

  const credential = bank.credentials.find((item) => item.id === credentialId);
  if (!credential) return { errors: ["Credential not found."] };

  const suffix = Math.random().toString(36).slice(2, 6);
  const rotated: BankApiCredential = {
    ...credential,
    id: createId(),
    clientId: `${credential.clientId.split("-")[0]}-rot-${suffix}`,
    createdAt: new Date().toISOString(),
  };

  writeBankCredentials(
    bankId,
    bank.credentials.map((item) =>
      item.id === credentialId ? rotated : item,
    ),
  );

  return {
    credential: {
      ...rotated,
      bankId: bank.id,
      bankName: bank.displayName,
    },
  };
}

export const emptyCredentialRequest = (bankId: string): CredentialRequestInput => ({
  bankId,
  environment: "sandbox",
  clientIdPrefix: "",
  expiry: "",
  scopes: {
    lcIssue: true,
    guaranteeRead: true,
    settlementRelease: false,
    kycVerify: false,
    riskExposure: false,
  },
});

export type LcType = "sight" | "usance" | "bond" | "blocked";
export type LcStatus = "draft" | "issued" | "expired";

export type LetterOfCreditInput = {
  bankId: string;
  applicant: string;
  beneficiary: string;
  lcType: LcType;
  amount: string;
  contractUid: string;
  expiryDate: string;
  collateralReference: string;
  pdfTemplate: string;
};

export type LetterOfCreditRecord = LetterOfCreditInput & {
  id: string;
  lcUid: string;
  status: LcStatus;
  pdfPath?: string;
  createdAt: string;
  updatedAt: string;
};

export type TradeContractInput = {
  bankId: string;
  buyer: string;
  seller: string;
  guaranteeLcUid: string;
  contractType: string;
  commodity: string;
  quantity: string;
  price: string;
  settlementTrigger: string;
};

export type ContractBlockchainAnchor = {
  network: string;
  smartContract: string;
  txHash: string;
  blockNumber: number;
  documentHash: string;
  anchoredAt: string;
};

export type TradeContractRecord = TradeContractInput & {
  id: string;
  contractUid: string;
  status: "draft" | "generated" | "anchored";
  pdfPath?: string;
  blockchain?: ContractBlockchainAnchor;
  createdAt: string;
  updatedAt: string;
};

export type SettlementStatus = "pending" | "confirmed" | "exception";
export type SettlementRecord = {
  id: string;
  bankId: string;
  contractUid: string;
  buyer: string;
  seller: string;
  amount: string;
  status: SettlementStatus;
  trigger: string;
  updatedAt: string;
};

export type RiskAlertSeverity = "low" | "medium" | "high";
export type RiskAlertRecord = {
  id: string;
  bankId: string;
  clientName: string;
  commodity: string;
  exposure: string;
  severity: RiskAlertSeverity;
  status: "open" | "acknowledged" | "closed";
  message: string;
  updatedAt: string;
};

export const OPERATIONS_UPDATED_EVENT = "ankuaru:operations-updated";

type OpsCollection =
  | "lettersOfCredit"
  | "tradeContracts"
  | "settlements"
  | "riskAlerts";

function notifyOperationsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPERATIONS_UPDATED_EVENT));
  }
}

function readOpsCollection<K extends OpsCollection>(
  key: K,
): ReturnType<typeof dbGet<K>> {
  return dbGet(key);
}

function writeOpsCollection(key: OpsCollection, records: unknown[]) {
  dbSet(key, records as ReturnType<typeof dbGet<typeof key>>);
  notifyOperationsUpdated();
}

function upsertOpsRecord<C extends OpsCollection>(
  key: C,
  record: ReturnType<typeof dbGet<C>>[number],
) {
  const records = [...readOpsCollection(key)];
  const index = records.findIndex((item) => item.id === record.id);
  if (index >= 0) records[index] = record;
  else records.unshift(record);
  writeOpsCollection(key, records);
  return record;
}

export function listLettersOfCredit(bankId: string) {
  return readOpsCollection("lettersOfCredit").filter((lc) => lc.bankId === bankId);
}

export function listTradeContracts(bankId: string) {
  return readOpsCollection("tradeContracts").filter(
    (contract) => contract.bankId === bankId,
  );
}

export function listSettlements(bankId: string) {
  return readOpsCollection("settlements").filter(
    (settlement) => settlement.bankId === bankId,
  );
}

export function listRiskAlerts(bankId: string) {
  return readOpsCollection("riskAlerts").filter(
    (alert) => alert.bankId === bankId,
  );
}

export const emptyLetterOfCreditInput = (
  bankId: string,
): LetterOfCreditInput => ({
  bankId,
  applicant: "",
  beneficiary: "",
  lcType: "sight",
  amount: "",
  contractUid: "",
  expiryDate: defaultLcExpiryDate(),
  collateralReference: buildLcCollateralReference(bankId),
  pdfTemplate: "NBE compliant LC template v1",
});

function bankSlugCode(bankId: string) {
  return (getBank(bankId)?.slug ?? "bnk").toUpperCase();
}

export function defaultLcExpiryDate(days = 90) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function buildLcCollateralReference(bankId: string) {
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `Blocked deposit ${bankSlugCode(bankId)}-${suffix}`;
}

export function previewLcUid(bankId: string) {
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `LC-${bankSlugCode(bankId)}-${new Date().getFullYear()}-${suffix}`;
}

export function formatLcType(type: LcType) {
  switch (type) {
    case "sight":
      return "Sight LC";
    case "usance":
      return "Usance LC";
    case "bond":
      return "Performance Bond";
    case "blocked":
      return "Blocked Funds";
  }
}

export function findTradeContractByUid(bankId: string, contractUid: string) {
  return listTradeContracts(bankId).find(
    (contract) => contract.contractUid === contractUid,
  );
}

export function findLetterOfCreditByUid(bankId: string, lcUid: string) {
  return listLettersOfCredit(bankId).find((lc) => lc.lcUid === lcUid);
}

export function lcHasGeneratedContract(bankId: string, lcUid: string) {
  return listTradeContracts(bankId).some(
    (contract) =>
      contract.guaranteeLcUid === lcUid &&
      (contract.status === "generated" || contract.status === "anchored"),
  );
}

export function previewContractUid() {
  const suffix = Math.random().toString(36).slice(2, 5);
  return `CTR-${new Date().getFullYear()}-${suffix.padStart(5, "0")}`;
}

function primaryCommodity(client?: ClientAccountRecord) {
  return client?.permittedCommodities?.split(",")[0]?.trim() ?? "";
}

export function buildContractDefaultsFromLc(
  bankId: string,
  lc: LetterOfCreditRecord,
): Partial<TradeContractInput> {
  const buyer = findClientByName(lc.applicant, bankId);
  const seller = findClientByName(lc.beneficiary, bankId);
  const commodity =
    primaryCommodity(buyer) || primaryCommodity(seller) || "Coffee";

  return {
    buyer: lc.applicant,
    seller: lc.beneficiary,
    guaranteeLcUid: lc.lcUid,
    contractType: `${commodity} export sale · FOB Djibouti`,
    commodity,
    quantity: "",
    price: lc.amount ? `Up to ${lc.amount}` : "",
    settlementTrigger: "Warehouse + BL confirmation",
  };
}

export function buildContractDefaultsFromParties(
  bankId: string,
  buyerName: string,
  sellerName = "",
): Partial<TradeContractInput> {
  const buyer = findClientByName(buyerName, bankId);
  const commodity = primaryCommodity(buyer);

  return {
    buyer: buyerName,
    seller: sellerName,
    commodity,
    contractType: commodity ? `${commodity} export sale · FOB Djibouti` : "",
  };
}

export function assessContractGeneration(input: TradeContractInput): {
  errors: string[];
  warnings: string[];
  buyerClient?: ClientAccountRecord;
  sellerClient?: ClientAccountRecord;
  linkedLc?: LetterOfCreditRecord;
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const buyerClient = findClientByName(input.buyer.trim(), input.bankId);
  const sellerClient = findClientByName(input.seller.trim(), input.bankId);
  const linkedLc = input.guaranteeLcUid.trim()
    ? findLetterOfCreditByUid(input.bankId, input.guaranteeLcUid.trim())
    : undefined;

  if (!input.buyer.trim() || !input.seller.trim()) {
    errors.push("Buyer and seller are required.");
  }
  if (!input.commodity.trim()) {
    errors.push("Commodity is required.");
  }

  if (input.buyer.trim() && !buyerClient) {
    warnings.push("Buyer is not registered as a bank client.");
  }
  if (input.seller.trim() && !sellerClient) {
    warnings.push("Seller is not registered as a bank client.");
  }
  if (buyerClient && buyerClient.kycStatus !== "active") {
    errors.push(`${input.buyer} must be KYC-approved before contract generation.`);
  }
  if (sellerClient && sellerClient.kycStatus !== "active") {
    errors.push(`${input.seller} must be KYC-approved before contract generation.`);
  }
  if (
    buyerClient &&
    buyerClient.traderType !== "buyer" &&
    buyerClient.traderType !== "both"
  ) {
    warnings.push("Buyer is not configured as a buyer on this bank tenant.");
  }
  if (
    sellerClient &&
    sellerClient.traderType !== "seller" &&
    sellerClient.traderType !== "both"
  ) {
    warnings.push("Seller is not configured as a seller on this bank tenant.");
  }

  if (!input.guaranteeLcUid.trim()) {
    warnings.push("No letter of credit linked — contract will not be bank-backed.");
  } else if (!linkedLc) {
    warnings.push("LC UID is not registered on ANKUARU.");
  } else {
    if (
      linkedLc.applicant.trim().toLowerCase() !==
        input.buyer.trim().toLowerCase() ||
      linkedLc.beneficiary.trim().toLowerCase() !==
        input.seller.trim().toLowerCase()
    ) {
      warnings.push("Buyer/seller do not match the linked LC parties.");
    }
    if (lcHasGeneratedContract(input.bankId, linkedLc.lcUid)) {
      warnings.push("A contract is already generated for this LC.");
    }
  }

  return { errors, warnings, buyerClient, sellerClient, linkedLc };
}

export function contractHasIssuedLc(bankId: string, contractUid: string) {
  return listLettersOfCredit(bankId).some(
    (lc) => lc.contractUid === contractUid && lc.status === "issued",
  );
}

function parseUsdAmount(value: string) {
  const match = value.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

export function buildLcDefaultsFromContract(
  bankId: string,
  contract: TradeContractRecord,
): Partial<LetterOfCreditInput> {
  const buyer = findClientByName(contract.buyer, bankId);
  return {
    applicant: contract.buyer,
    beneficiary: contract.seller,
    contractUid: contract.contractUid,
    amount: buyer?.perTradeLimit ?? "",
    expiryDate: defaultLcExpiryDate(90),
    collateralReference: buildLcCollateralReference(bankId),
    lcType: "sight",
    pdfTemplate: "NBE compliant LC template v1",
  };
}

export function buildLcDefaultsFromApplicant(
  bankId: string,
  applicantName: string,
  beneficiaryName = "",
): Partial<LetterOfCreditInput> {
  const applicant = findClientByName(applicantName, bankId);
  return {
    applicant: applicantName,
    beneficiary: beneficiaryName,
    amount: applicant?.perTradeLimit ?? "",
    expiryDate: defaultLcExpiryDate(90),
    collateralReference: buildLcCollateralReference(bankId),
  };
}

export function assessLcIssuance(input: LetterOfCreditInput): {
  errors: string[];
  warnings: string[];
  applicantClient?: ClientAccountRecord;
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const applicantClient = findClientByName(input.applicant.trim(), input.bankId);

  if (input.applicant.trim() && !applicantClient) {
    warnings.push("Applicant is not registered as a bank client.");
  }
  if (input.beneficiary.trim() && !findClientByName(input.beneficiary.trim(), input.bankId)) {
    warnings.push("Beneficiary is not registered as a bank client.");
  }
  if (applicantClient && applicantClient.kycStatus !== "active") {
    errors.push(`${input.applicant} must be KYC-approved before LC issuance.`);
  }
  if (applicantClient?.riskRating === "high") {
    warnings.push("Applicant is high risk — complete EDD review before issuing.");
  }
  if (
    applicantClient &&
    applicantClient.traderType !== "buyer" &&
    applicantClient.traderType !== "both"
  ) {
    warnings.push("Applicant is not configured as a buyer on this bank tenant.");
  }

  const proposedAmount = parseUsdAmount(input.amount);
  const perTradeLimit = applicantClient
    ? parseUsdAmount(applicantClient.perTradeLimit)
    : null;
  if (
    proposedAmount !== null &&
    perTradeLimit !== null &&
    proposedAmount > perTradeLimit
  ) {
    warnings.push(
      `Amount exceeds applicant per-trade limit (${applicantClient?.perTradeLimit}).`,
    );
  }

  if (input.contractUid.trim()) {
    const contract = findTradeContractByUid(input.bankId, input.contractUid.trim());
    if (!contract) {
      warnings.push("Contract UID is not registered on ANKUARU.");
    } else if (
      contract.buyer.trim().toLowerCase() !== input.applicant.trim().toLowerCase() ||
      contract.seller.trim().toLowerCase() !==
        input.beneficiary.trim().toLowerCase()
    ) {
      warnings.push("Applicant/beneficiary do not match the linked contract parties.");
    }
    if (contractHasIssuedLc(input.bankId, input.contractUid.trim())) {
      warnings.push("An LC is already issued for this contract.");
    }
  }

  return { errors, warnings, applicantClient };
}

export const emptyTradeContractInput = (
  bankId: string,
): TradeContractInput => ({
  bankId,
  buyer: "",
  seller: "",
  guaranteeLcUid: "",
  contractType: "",
  commodity: "",
  quantity: "",
  price: "",
  settlementTrigger: "",
});

export function issueLetterOfCredit(
  input: LetterOfCreditInput,
  existingId?: string,
): { lc?: LetterOfCreditRecord; errors?: string[] } {
  const errors: string[] = [];
  if (!input.applicant.trim() || !input.beneficiary.trim()) {
    errors.push("Applicant and beneficiary are required.");
  }
  if (!input.amount.trim()) errors.push("Amount is required.");
  if (!input.expiryDate.trim()) errors.push("Expiry date is required.");

  const assessment = assessLcIssuance(input);
  errors.push(...assessment.errors);

  if (errors.length) return { errors };

  const now = new Date().toISOString();
  const existing = existingId
    ? readOpsCollection("lettersOfCredit").find((lc) => lc.id === existingId)
    : undefined;

  const lc: LetterOfCreditRecord = {
    ...input,
    id: existing?.id ?? createId(),
    lcUid: existing?.lcUid ?? previewLcUid(input.bankId),
    status: "issued",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  return { lc: upsertOpsRecord("lettersOfCredit", lc) };
}

export function contractPdfUrl(contractUid: string) {
  return `/api/contracts/${encodeURIComponent(contractUid)}/pdf`;
}

export function formatBlockchainTx(txHash: string) {
  if (txHash.length <= 14) return txHash;
  return `${txHash.slice(0, 8)}…${txHash.slice(-6)}`;
}

export async function anchorTradeContractOnChain(contractUid: string) {
  await persistCollection("tradeContracts");

  const response = await fetch(
    `/api/contracts/${encodeURIComponent(contractUid)}/anchor`,
    { method: "POST" },
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to anchor contract on blockchain.");
  }

  return (await response.json()) as {
    ok: true;
    contractUid: string;
    status: TradeContractRecord["status"];
    blockchain: ContractBlockchainAnchor;
    alreadyAnchored: boolean;
  };
}

export function lcPdfUrl(lcUid: string) {
  return `/api/lc/${encodeURIComponent(lcUid)}/pdf`;
}

export async function createContractPdf(
  contractUid: string,
  contract?: TradeContractRecord,
) {
  await persistCollection("tradeContracts");

  const response = await fetch("/api/contracts/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contractUid, contract }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to generate contract PDF.");
  }

  return (await response.json()) as { ok: true; contractUid: string; pdfUrl: string };
}

export async function createLcPdf(lcUid: string, lc?: LetterOfCreditRecord) {
  await persistCollection("lettersOfCredit");

  const response = await fetch("/api/lc/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lcUid, lc }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to generate LC PDF.");
  }

  return (await response.json()) as { ok: true; lcUid: string; pdfUrl: string };
}

export function generateTradeContract(
  input: TradeContractInput,
  existingId?: string,
): { contract?: TradeContractRecord; errors?: string[] } {
  const assessment = assessContractGeneration(input);
  if (assessment.errors.length) return { errors: assessment.errors };

  const now = new Date().toISOString();
  const existing = existingId
    ? readOpsCollection("tradeContracts").find(
        (contract) => contract.id === existingId,
      )
    : undefined;

  const contract: TradeContractRecord = {
    ...input,
    id: existing?.id ?? createId(),
    contractUid:
      existing?.contractUid ?? previewContractUid(),
    status: "generated",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  return { contract: upsertOpsRecord("tradeContracts", contract) };
}

export function getOperationsStats(bankId: string) {
  return {
    lcs: listLettersOfCredit(bankId).length,
    contracts: listTradeContracts(bankId).length,
    pendingSettlements: listSettlements(bankId).filter(
      (item) => item.status === "pending",
    ).length,
    openRiskAlerts: listRiskAlerts(bankId).filter(
      (item) => item.status === "open",
    ).length,
  };
}

function matchesClientParty(partyName: string, clientLegalName: string) {
  return partyName.trim().toLowerCase() === clientLegalName.trim().toLowerCase();
}

export function listClientLettersOfCredit(
  clientLegalName: string,
  bankId: string,
) {
  return listLettersOfCredit(bankId).filter(
    (lc) =>
      matchesClientParty(lc.applicant, clientLegalName) ||
      matchesClientParty(lc.beneficiary, clientLegalName),
  );
}

export function listClientTradeContracts(
  clientLegalName: string,
  bankId: string,
) {
  return listTradeContracts(bankId).filter(
    (contract) =>
      matchesClientParty(contract.buyer, clientLegalName) ||
      matchesClientParty(contract.seller, clientLegalName),
  );
}

export function listClientSettlements(clientLegalName: string, bankId: string) {
  return listSettlements(bankId).filter(
    (settlement) =>
      matchesClientParty(settlement.buyer, clientLegalName) ||
      matchesClientParty(settlement.seller, clientLegalName),
  );
}

export function getClientTradeSummary(clientLegalName: string, bankId: string) {
  const contracts = listClientTradeContracts(clientLegalName, bankId);
  const lcs = listClientLettersOfCredit(clientLegalName, bankId);
  const settlements = listClientSettlements(clientLegalName, bankId);

  return {
    contracts: contracts.length,
    lcs: lcs.length,
    pendingSettlements: settlements.filter((item) => item.status === "pending")
      .length,
    activeContracts: contracts.filter(
      (item) => item.status === "generated" || item.status === "anchored",
    ).length,
  };
}
