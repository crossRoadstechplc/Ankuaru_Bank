import { listBanks } from "./bank-db";
import { dbGet, dbSet } from "@/lib/json-db/client";

export const TENANT_UPDATED_EVENT = "ankuaru:tenant-updated";

type TenantCollection = "internalUsers" | "clients" | "rbacPolicies";

export type InternalUserRole = "BANK_ONBOARDER" | "BANK_VERIFIER";

export type InternalUserStatus = "draft" | "invited" | "active";
export type TraderType = "buyer" | "seller" | "both";
export type KycStatus = "draft" | "pending" | "active" | "suspended";
export type RiskRating = "low" | "medium" | "high";
export type RbacRole = "BANK_ADMIN" | InternalUserRole;
export type RbacPolicyStatus = "draft" | "published";

export type InternalUserPermissions = {
  viewClients: boolean;
  createKycCase: boolean;
  reviewLcRequests: boolean;
  issueGuarantees: boolean;
  verifyBlockchainRecords: boolean;
  configureRiskRules: boolean;
  exportAuditReports: boolean;
};

export type InternalUserInput = {
  bankId: string;
  fullName: string;
  workEmail: string;
  branchDesk: string;
  role: InternalUserRole;
  approvalLimit: string;
  commodityScope: string;
  effectiveFrom: string;
  permissions: InternalUserPermissions;
};

export type InternalUserRecord = InternalUserInput & {
  id: string;
  status: InternalUserStatus;
  createdAt: string;
  updatedAt: string;
};

export type ClientEddChecklist = {
  beneficialOwnership: boolean;
  sanctionsScreening: boolean;
  pepAdverseMedia: boolean;
  sourceOfFunds: boolean;
  tradeHistory: boolean;
  complianceSignOff: boolean;
};

export type ClientDocumentChecks = {
  businessLicense: boolean;
  taxCertificate: boolean;
  beneficialOwnershipDoc: boolean;
  sanctionsScreening: boolean;
  pepAdverseMedia: boolean;
  sourceOfFunds: boolean;
};

export type VerificationDecision = "" | "approve" | "reject" | "more-info";

export type VerificationChecklist = {
  kycDocumentsComplete: boolean;
  collateralReviewed: boolean;
  creditExposureApproved: boolean;
  complianceSignOffComplete: boolean;
};

export type ClientAccountInput = {
  bankId: string;
  legalName: string;
  traderType: TraderType;
  registrationTaxId: string;
  relationshipManager: string;
  kycStatus: KycStatus;
  riskRating: RiskRating;
  eddNotes: string;
  permittedCommodities: string;
  edd: ClientEddChecklist;
  dailyLimit: string;
  perTradeLimit: string;
  totalExposureLimit: string;
  beneficialOwner: string;
  jurisdiction: string;
  contactEmail: string;
  preferredBank: string;
  documentChecks: ClientDocumentChecks;
  verificationDecision: VerificationDecision;
  verificationNotes: string;
  verificationChecklist: VerificationChecklist;
};

export type ClientAccountRecord = ClientAccountInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type RbacPermissionGroups = {
  clientOnboardingKyc: boolean;
  lcRequestReview: boolean;
  guaranteeIssuance: boolean;
  blockchainVerification: boolean;
  riskRuleConfiguration: boolean;
  settlementReleaseApproval: boolean;
  auditExport: boolean;
};

export type RbacPolicyInput = {
  bankId: string;
  role: RbacRole;
  branchScope: string;
  approvalThreshold: string;
  permissions: RbacPermissionGroups;
};

export type RbacPolicyRecord = RbacPolicyInput & {
  id: string;
  status: RbacPolicyStatus;
  createdAt: string;
  updatedAt: string;
};

export const emptyInternalUserInput = (bankId: string): InternalUserInput => ({
  bankId,
  fullName: "",
  workEmail: "",
  branchDesk: "",
  role: "BANK_VERIFIER",
  approvalLimit: "",
  commodityScope: "",
  effectiveFrom: "",
  permissions: {
    viewClients: true,
    createKycCase: false,
    reviewLcRequests: true,
    issueGuarantees: false,
    verifyBlockchainRecords: true,
    configureRiskRules: false,
    exportAuditReports: false,
  },
});

export const emptyClientAccountInput = (bankId: string): ClientAccountInput => ({
  bankId,
  legalName: "",
  traderType: "buyer",
  registrationTaxId: "",
  relationshipManager: "",
  kycStatus: "draft",
  riskRating: "medium",
  eddNotes: "",
  permittedCommodities: "",
  edd: {
    beneficialOwnership: false,
    sanctionsScreening: false,
    pepAdverseMedia: false,
    sourceOfFunds: false,
    tradeHistory: false,
    complianceSignOff: false,
  },
  dailyLimit: "",
  perTradeLimit: "",
  totalExposureLimit: "",
  beneficialOwner: "",
  jurisdiction: "",
  contactEmail: "",
  preferredBank: "",
  documentChecks: {
    businessLicense: false,
    taxCertificate: false,
    beneficialOwnershipDoc: false,
    sanctionsScreening: false,
    pepAdverseMedia: false,
    sourceOfFunds: false,
  },
  verificationDecision: "",
  verificationNotes: "",
  verificationChecklist: {
    kycDocumentsComplete: false,
    collateralReviewed: false,
    creditExposureApproved: false,
    complianceSignOffComplete: false,
  },
});

function normalizeClient(record: ClientAccountRecord): ClientAccountRecord {
  return {
    ...emptyClientAccountInput(record.bankId),
    ...record,
    edd: { ...emptyClientAccountInput(record.bankId).edd, ...record.edd },
    documentChecks: {
      ...emptyClientAccountInput(record.bankId).documentChecks,
      ...record.documentChecks,
    },
    verificationChecklist: {
      ...emptyClientAccountInput(record.bankId).verificationChecklist,
      ...record.verificationChecklist,
    },
  };
}

export const emptyRbacPolicyInput = (bankId: string): RbacPolicyInput => ({
  bankId,
  role: "BANK_VERIFIER",
  branchScope: "",
  approvalThreshold: "",
  permissions: {
    clientOnboardingKyc: true,
    lcRequestReview: true,
    guaranteeIssuance: false,
    blockchainVerification: true,
    riskRuleConfiguration: false,
    settlementReleaseApproval: false,
    auditExport: false,
  },
});

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function notifyUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(TENANT_UPDATED_EVENT));
  }
}

function readTenantCollection<K extends TenantCollection>(
  key: K,
): ReturnType<typeof dbGet<K>> {
  return dbGet(key);
}

function writeTenantCollection(key: TenantCollection, records: unknown[]) {
  dbSet(key, records as ReturnType<typeof dbGet<typeof key>>);
  notifyUpdated();
}

function upsertRecord<C extends TenantCollection>(
  key: C,
  record: ReturnType<typeof dbGet<C>>[number],
) {
  const records = [...readTenantCollection(key)];
  const index = records.findIndex((item) => item.id === record.id);
  if (index >= 0) records[index] = record;
  else records.unshift(record);
  writeTenantCollection(key, records);
  return record;
}

export function resolveBankId(bankName?: string) {
  if (!bankName) return undefined;
  return listBanks().find((bank) => bank.displayName === bankName)?.id;
}

export function listInternalUsers(bankId: string) {
  return readTenantCollection("internalUsers")
    .filter((user) => user.bankId === bankId)
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    );
}

export function listClientAccounts(bankId: string) {
  return readTenantCollection("clients")
    .map(normalizeClient)
    .filter((client) => client.bankId === bankId)
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    );
}

export function findClientByName(name: string, bankId?: string) {
  const normalized = name.trim().toLowerCase();
  const clients = readTenantCollection("clients")
    .map(normalizeClient)
    .filter((client) =>
      bankId ? client.bankId === bankId : true,
    );
  return clients.find(
    (client) => client.legalName.trim().toLowerCase() === normalized,
  );
}

export function getClientOnboardingStats(bankId: string) {
  const clients = listClientAccounts(bankId);
  return {
    draft: clients.filter((client) => client.kycStatus === "draft").length,
    pending: clients.filter((client) => client.kycStatus === "pending").length,
    moreInfo: clients.filter(
      (client) => client.verificationDecision === "more-info",
    ).length,
    approved: clients.filter((client) => client.kycStatus === "active").length,
  };
}

export function getClientOnboardingStages(client: ClientAccountRecord) {
  return [
    {
      stage: "Registration",
      status: client.kycStatus === "draft" ? "Draft" : "Submitted",
      owner: "Client",
      nextStep:
        client.kycStatus === "draft"
          ? "Complete onboarding form"
          : "Await bank review",
    },
    {
      stage: "KYC / EDD",
      status:
        client.kycStatus === "active"
          ? "Approved"
          : client.kycStatus === "pending"
            ? "In progress"
            : "Not started",
      owner: client.preferredBank || "Bank",
      nextStep:
        client.kycStatus === "pending"
          ? "Verifier review"
          : "Upload beneficial owner docs",
    },
    {
      stage: "Risk rating",
      status:
        client.riskRating === "high" ? "Review required" : "Pending",
      owner: "Bank Admin",
      nextStep: "Review exposure",
    },
    {
      stage: "LC request",
      status: client.kycStatus === "active" ? "Ready" : "Not started",
      owner: "Verifier",
      nextStep:
        client.kycStatus === "active"
          ? "Submit trade reference"
          : "Complete onboarding",
    },
    {
      stage: "Trading access",
      status: client.kycStatus === "active" ? "Unlocked" : "Locked",
      owner: "Platform",
      nextStep:
        client.kycStatus === "active"
          ? "Start trading"
          : "Complete onboarding",
    },
  ];
}

export function listRbacPolicies(bankId: string) {
  return readTenantCollection("rbacPolicies")
    .filter((policy) => policy.bankId === bankId)
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    );
}

export function getTenantStats(bankId: string) {
  const users = listInternalUsers(bankId);
  const clients = listClientAccounts(bankId);
  const policies = listRbacPolicies(bankId);

  return {
    internalUsers: users.filter((user) => user.status !== "draft").length,
    clients: clients.length,
    pendingKyc: clients.filter(
      (client) => client.kycStatus === "pending" || client.kycStatus === "draft",
    ).length,
    rbacPolicies: policies.filter((policy) => policy.status === "published").length,
    buyers: clients.filter(
      (client) => client.traderType === "buyer" || client.traderType === "both",
    ).length,
    sellers: clients.filter(
      (client) => client.traderType === "seller" || client.traderType === "both",
    ).length,
    highRisk: clients.filter((client) => client.riskRating === "high").length,
  };
}

export function formatInternalUserRole(role: InternalUserRole) {
  switch (role) {
    case "BANK_ONBOARDER":
      return "Onboarder";
    case "BANK_VERIFIER":
      return "Verifier";
  }
}

export function formatInternalUserStatus(status: InternalUserStatus) {
  switch (status) {
    case "draft":
      return "Draft";
    case "invited":
      return "Invite sent";
    case "active":
      return "Active";
  }
}

export function formatKycStatus(status: KycStatus) {
  switch (status) {
    case "draft":
      return "Draft";
    case "pending":
      return "KYC pending";
    case "active":
      return "Approved";
    case "suspended":
      return "Suspended";
  }
}

export function formatTraderType(type: TraderType) {
  switch (type) {
    case "buyer":
      return "Buyer";
    case "seller":
      return "Seller";
    case "both":
      return "Buyer & Seller";
  }
}

export function formatClientTradingLimit(
  client: Pick<
    ClientAccountRecord,
    "dailyLimit" | "perTradeLimit" | "totalExposureLimit"
  >,
) {
  const total = client.totalExposureLimit.trim();
  const daily = client.dailyLimit.trim();
  const perTrade = client.perTradeLimit.trim();
  if (total) return total;
  if (daily && perTrade) return `${daily} / ${perTrade}`;
  if (daily) return daily;
  if (perTrade) return perTrade;
  return "—";
}

export function saveInternalUser(
  input: InternalUserInput,
  existingId?: string,
  invite = false,
): { user?: InternalUserRecord; errors?: string[] } {
  const errors: string[] = [];
  if (!input.fullName.trim()) errors.push("Full name is required.");
  if (!input.workEmail.trim()) errors.push("Work email is required.");
  if (!input.bankId) errors.push("Bank tenant is required.");
  if (errors.length) return { errors };

  const now = new Date().toISOString();
  const existing = existingId
    ? readTenantCollection("internalUsers").find((user) => user.id === existingId)
    : undefined;

  const user: InternalUserRecord = {
    ...input,
    id: existing?.id ?? createId("staff"),
    status: invite ? "invited" : existing?.status ?? "draft",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  if (invite) user.status = "invited";
  return { user: upsertRecord("internalUsers", user) };
}

export function deleteInternalUser(id: string): { errors?: string[] } {
  const users = readTenantCollection("internalUsers");
  if (!users.some((user) => user.id === id)) {
    return { errors: ["Internal user not found."] };
  }
  writeTenantCollection(
    "internalUsers",
    users.filter((user) => user.id !== id),
  );
  return {};
}

export function saveClientAccount(
  input: ClientAccountInput,
  existingId?: string,
): { client?: ClientAccountRecord; errors?: string[] } {
  const errors: string[] = [];
  if (!input.legalName.trim()) errors.push("Legal name is required.");
  if (!input.bankId) errors.push("Bank tenant is required.");
  if (errors.length) return { errors };

  const now = new Date().toISOString();
  const existing = existingId
    ? readTenantCollection("clients").find((client) => client.id === existingId)
    : undefined;

  const client: ClientAccountRecord = normalizeClient({
    ...input,
    id: existing?.id ?? createId("client"),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });

  return { client: upsertRecord("clients", client) };
}

export function submitOnboardingClient(
  input: ClientAccountInput,
  existingId?: string,
): { client?: ClientAccountRecord; errors?: string[] } {
  return saveClientAccount({ ...input, kycStatus: "pending" }, existingId);
}

export function completeClientVerification(
  clientId: string,
  decision: VerificationDecision,
  notes: string,
  checklist: VerificationChecklist,
): { client?: ClientAccountRecord; errors?: string[] } {
  const client = readTenantCollection("clients")
    .map(normalizeClient)
    .find((item) => item.id === clientId);
  if (!client) return { errors: ["Client not found."] };

  const nextStatus: KycStatus =
    decision === "approve"
      ? "active"
      : decision === "reject"
        ? "suspended"
        : "pending";

  return saveClientAccount(
    {
      ...client,
      verificationDecision: decision,
      verificationNotes: notes,
      verificationChecklist: checklist,
      kycStatus: nextStatus,
    },
    clientId,
  );
}

export function submitClientKyc(
  input: ClientAccountInput,
  existingId?: string,
): { client?: ClientAccountRecord; errors?: string[] } {
  const draft = saveClientAccount({ ...input, kycStatus: "pending" }, existingId);
  return draft;
}

export function activateClientAccount(
  input: ClientAccountInput,
  existingId?: string,
): { client?: ClientAccountRecord; errors?: string[] } {
  if (!input.relationshipManager.trim()) {
    return { errors: ["Relationship manager is required before activation."] };
  }
  return saveClientAccount({ ...input, kycStatus: "active" }, existingId);
}

export function deleteClientAccount(id: string): { errors?: string[] } {
  const records = readTenantCollection("clients");
  if (!records.some((client) => client.id === id)) {
    return { errors: ["Client not found."] };
  }
  writeTenantCollection(
    "clients",
    records.filter((client) => client.id !== id),
  );
  return {};
}

export function saveRbacPolicy(
  input: RbacPolicyInput,
  existingId?: string,
  publish = false,
): { policy?: RbacPolicyRecord; errors?: string[] } {
  const errors: string[] = [];
  if (!input.bankId) errors.push("Bank tenant is required.");
  if (!input.branchScope.trim()) errors.push("Branch scope is required.");
  if (errors.length) return { errors };

  const now = new Date().toISOString();
  const existing = existingId
    ? readTenantCollection("rbacPolicies").find((policy) => policy.id === existingId)
    : undefined;

  const policy: RbacPolicyRecord = {
    ...input,
    id: existing?.id ?? createId("rbac"),
    status: publish ? "published" : existing?.status ?? "draft",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  if (publish) policy.status = "published";
  return { policy: upsertRecord("rbacPolicies", policy) };
}

export const rbacMatrixRows = [
  ["Create client", "Yes", "Yes", "No"],
  ["Approve KYC", "Yes", "No", "Yes"],
  ["Issue guarantee", "Yes", "No", "Yes"],
  ["Verify on-chain record", "Yes", "No", "Yes"],
  ["Configure risk rules", "Yes", "No", "No"],
  ["Emergency action", "Yes", "No", "No"],
  ["Export audit reports", "Yes", "No", "Limited"],
] as const;
