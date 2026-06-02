import { dbGet, dbSet } from "@/lib/json-db/client";

export type BankStatus = "draft" | "pending_review" | "active" | "suspended";
export type RegulatorStatus = "licensed" | "pending" | "restricted";
export type ApiEnvironment = "sandbox" | "production";

export type BankDocuments = {
  bankingLicense: boolean;
  incorporation: boolean;
  boardResolution: boolean;
  apiSecurityQuestionnaire: boolean;
  authorizedSignatoryList: boolean;
  amlCftPolicy: boolean;
};

export type BankPdfAssets = {
  signatureFile?: string;
  verifierStampFile?: string;
  signatoryName?: string;
  updatedAt?: string;
};

export type BankApiCredential = {
  id: string;
  clientId: string;
  environment: ApiEnvironment;
  scopes: string;
  status: "active" | "sandbox";
  createdAt: string;
};

export type BankRegistrationInput = {
  legalName: string;
  licenseNumber: string;
  taxIdentificationNumber: string;
  headOfficeCity: string;
  regulatorStatus: RegulatorStatus;
  dataResidencyRegion: string;
  displayName: string;
  logoUrl: string;
  supportedCommodities: string;
  supportedCurrencies: string;
  primaryContactEmail: string;
  branchesEnabled: string;
  tradeFinanceContact: string;
  documents: BankDocuments;
  apiEnvironment: ApiEnvironment;
  clientIdPrefix: string;
  credentialScopes: string;
};

export type BankRecord = BankRegistrationInput & {
  id: string;
  slug: string;
  status: BankStatus;
  adminUser: string;
  nextTask: string;
  credentials: BankApiCredential[];
  pdfAssets?: BankPdfAssets;
  createdAt: string;
  updatedAt: string;
};

export const BANKS_UPDATED_EVENT = "ankuaru:banks-updated";
export const BANK_ADMINS_UPDATED_EVENT = "ankuaru:bank-admins-updated";

export type BankAdminPermissions = {
  manageBankProfile: boolean;
  manageBankUsers: boolean;
  manageClientsAndLimits: boolean;
  viewAuditLogs: boolean;
};

export type BankAdminStatus = "draft" | "invited" | "active";

export type BankAdminInput = {
  fullName: string;
  workEmail: string;
  mobileNumber: string;
  username: string;
  bankId: string;
  primaryBranch: string;
  role: "BANK_ADMIN";
  permissions: BankAdminPermissions;
};

export type BankAdminUser = BankAdminInput & {
  id: string;
  status: BankAdminStatus;
  createdAt: string;
  updatedAt: string;
};

export const emptyBankAdminInput = (bankId = ""): BankAdminInput => ({
  fullName: "",
  workEmail: "",
  mobileNumber: "",
  username: "",
  bankId,
  primaryBranch: "",
  role: "BANK_ADMIN",
  permissions: {
    manageBankProfile: true,
    manageBankUsers: true,
    manageClientsAndLimits: true,
    viewAuditLogs: true,
  },
});

export const emptyBankRegistration = (): BankRegistrationInput => ({
  legalName: "",
  licenseNumber: "",
  taxIdentificationNumber: "",
  headOfficeCity: "",
  regulatorStatus: "licensed",
  dataResidencyRegion: "",
  displayName: "",
  logoUrl: "",
  supportedCommodities: "",
  supportedCurrencies: "",
  primaryContactEmail: "",
  branchesEnabled: "",
  tradeFinanceContact: "",
  documents: {
    bankingLicense: false,
    incorporation: false,
    boardResolution: false,
    apiSecurityQuestionnaire: false,
    authorizedSignatoryList: false,
    amlCftPolicy: false,
  },
  apiEnvironment: "sandbox",
  clientIdPrefix: "",
  credentialScopes: "lc:issue, guarantee:read, settlement:release",
});

function createId(prefix = "bank") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || `bank-${Date.now()}`;
}

function nextTaskFor(bank: BankRecord): string {
  if (bank.status === "suspended") return "Resolve suspension and reactivate bank";
  if (bank.status === "draft") return "Complete registration draft";
  if (bank.status === "pending_review") return "Verify license and approve bank";
  if (bank.credentials.length === 0) return "Generate sandbox credentials";
  if (bank.adminUser === "Pending") return "Create Bank Admin user";
  return "Review platform controls";
}

function updateBankStatus(
  id: string,
  status: BankStatus,
): { bank?: BankRecord; errors?: string[] } {
  const bank = getBank(id);
  if (!bank) return { errors: ["Bank not found."] };

  const updated: BankRecord = {
    ...bank,
    status,
    updatedAt: new Date().toISOString(),
    nextTask: "",
  };
  updated.nextTask = nextTaskFor(updated);
  return { bank: upsertBank(updated) };
}

function readRaw(): BankRecord[] {
  return dbGet("banks");
}

function writeRaw(banks: BankRecord[]) {
  dbSet("banks", banks);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(BANKS_UPDATED_EVENT));
  }
}

export function listBanks(): BankRecord[] {
  return readRaw().sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

export function getBank(id: string): BankRecord | undefined {
  return readRaw().find((bank) => bank.id === id);
}

export function getBankStats() {
  const banks = listBanks();
  const pendingReview = banks.filter((bank) => bank.status === "pending_review").length;
  const activeCredentials = banks.reduce(
    (total, bank) => total + bank.credentials.filter((cred) => cred.status === "active").length,
    0,
  );

  return {
    registered: banks.length,
    pendingReview,
    bankAdminUsers: banks.filter((bank) => bank.adminUser !== "Pending").length,
    activeCredentials,
    banks,
  };
}

function upsertBank(record: BankRecord) {
  const banks = readRaw();
  const index = banks.findIndex((bank) => bank.id === record.id);
  const next = [...banks];
  if (index >= 0) next[index] = record;
  else next.unshift(record);
  writeRaw(next);
  return record;
}

export function updateBankCredentials(
  bankId: string,
  credentials: BankApiCredential[],
) {
  const bank = getBank(bankId);
  if (!bank) return;
  upsertBank({
    ...bank,
    credentials,
    updatedAt: new Date().toISOString(),
  });
}

export function updateBankPdfAssets(
  bankId: string,
  pdfAssets: BankPdfAssets,
): { bank?: BankRecord; errors?: string[] } {
  const bank = getBank(bankId);
  if (!bank) return { errors: ["Bank not found."] };

  const updated: BankRecord = {
    ...bank,
    pdfAssets: {
      ...bank.pdfAssets,
      ...pdfAssets,
      updatedAt: new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  };

  return { bank: upsertBank(updated) };
}

function validateRegistration(input: BankRegistrationInput, forSubmit: boolean) {
  const errors: string[] = [];
  if (!input.legalName.trim()) errors.push("Legal bank name is required.");
  if (!input.licenseNumber.trim()) errors.push("License number is required.");
  if (!input.displayName.trim()) errors.push("Display name is required.");
  if (forSubmit && !input.primaryContactEmail.trim()) {
    errors.push("Primary contact email is required for compliance review.");
  }
  return errors;
}

export function saveBankDraft(
  input: BankRegistrationInput,
  existingId?: string,
): { bank?: BankRecord; admin?: BankAdminUser; errors?: string[] } {
  const errors = validateRegistration(input, false);
  if (errors.length) return { errors };

  const now = new Date().toISOString();
  const existing = existingId ? getBank(existingId) : undefined;
  const isNew = !existing;
  const banks = readRaw();
  const duplicate = banks.find(
    (bank) =>
      bank.licenseNumber.trim().toLowerCase() === input.licenseNumber.trim().toLowerCase() &&
      bank.id !== existingId,
  );
  if (duplicate) {
    return { errors: ["A bank with this license number is already registered."] };
  }

  const bank: BankRecord = {
    ...input,
    id: existing?.id ?? createId(),
    slug: existing?.slug ?? slugify(input.displayName || input.legalName),
    status: existing?.status === "active" ? "active" : "draft",
    adminUser: existing?.adminUser ?? "Pending",
    credentials: existing?.credentials ?? [],
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    nextTask: "",
  };
  bank.nextTask = nextTaskFor(bank);
  upsertBank(bank);

  const admin = isNew ? ensureDefaultBankAdmin(bank) : getBankAdminForBank(bank.id);
  return { bank: getBank(bank.id) ?? bank, admin: admin ?? undefined };
}

export function submitBankForReview(
  input: BankRegistrationInput,
  existingId?: string,
): { bank?: BankRecord; admin?: BankAdminUser; errors?: string[] } {
  const errors = validateRegistration(input, true);
  if (errors.length) return { errors };

  const draft = saveBankDraft(input, existingId);
  if (draft.errors?.length || !draft.bank) return draft;

  const bank: BankRecord = {
    ...draft.bank,
    status: "pending_review",
    updatedAt: new Date().toISOString(),
  };
  bank.nextTask = nextTaskFor(bank);
  upsertBank(bank);

  const admin = ensureDefaultBankAdmin(bank);
  return { bank: getBank(bank.id) ?? bank, admin: admin ?? draft.admin };
}

export function generateSandboxCredential(
  input: BankRegistrationInput,
  existingId?: string,
): { bank?: BankRecord; credential?: BankApiCredential; errors?: string[] } {
  const errors = validateRegistration(input, false);
  if (errors.length) return { errors };
  if (!input.clientIdPrefix.trim()) {
    return { errors: ["Client ID prefix is required to generate credentials."] };
  }

  const draft = saveBankDraft(input, existingId);
  if (draft.errors?.length || !draft.bank) return draft;

  const suffix = Math.random().toString(36).slice(2, 6);
  const credential: BankApiCredential = {
    id: createId(),
    clientId: `${input.clientIdPrefix.trim()}-sandbox-${suffix}`,
    environment: "sandbox",
    scopes: input.credentialScopes.trim() || "lc:issue, guarantee:read",
    status: "sandbox",
    createdAt: new Date().toISOString(),
  };

  const bank: BankRecord = {
    ...draft.bank,
    credentials: [...draft.bank.credentials, credential],
    updatedAt: new Date().toISOString(),
  };
  bank.nextTask = nextTaskFor(bank);
  return { bank: upsertBank(bank), credential };
}

export function formatBankStatus(status: BankStatus) {
  switch (status) {
    case "draft":
      return "Draft";
    case "pending_review":
      return "Docs review";
    case "active":
      return "Active";
    case "suspended":
      return "Suspended";
  }
}

export function approveBank(id: string): { bank?: BankRecord; errors?: string[] } {
  const bank = getBank(id);
  if (!bank) return { errors: ["Bank not found."] };
  if (bank.status === "active") {
    return { errors: [`${bank.displayName} is already active.`] };
  }
  if (bank.status === "suspended") {
    return { errors: ["Use Reactivate for suspended banks."] };
  }
  if (bank.regulatorStatus === "restricted") {
    return {
      errors: ["Cannot approve a bank with restricted regulator status."],
    };
  }
  return updateBankStatus(id, "active");
}

export function suspendBank(id: string): { bank?: BankRecord; errors?: string[] } {
  const bank = getBank(id);
  if (!bank) return { errors: ["Bank not found."] };
  if (bank.status === "suspended") {
    return { errors: [`${bank.displayName} is already suspended.`] };
  }
  if (bank.status !== "active") {
    return { errors: ["Only active banks can be suspended."] };
  }
  return updateBankStatus(id, "suspended");
}

export function reactivateBank(id: string): { bank?: BankRecord; errors?: string[] } {
  const bank = getBank(id);
  if (!bank) return { errors: ["Bank not found."] };
  if (bank.status !== "suspended") {
    return { errors: ["Only suspended banks can be reactivated."] };
  }
  if (bank.regulatorStatus === "restricted") {
    return {
      errors: ["Cannot reactivate a bank with restricted regulator status."],
    };
  }
  return updateBankStatus(id, "active");
}

function readAdminRaw(): BankAdminUser[] {
  return dbGet("bankAdmins");
}

function writeAdminRaw(admins: BankAdminUser[]) {
  dbSet("bankAdmins", admins);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(BANK_ADMINS_UPDATED_EVENT));
  }
}

function upsertAdmin(record: BankAdminUser) {
  const admins = readAdminRaw();
  const index = admins.findIndex((admin) => admin.id === record.id);
  const next = [...admins];
  if (index >= 0) next[index] = record;
  else next.unshift(record);
  writeAdminRaw(next);
  return record;
}

function linkAdminToBank(bankId: string, adminName: string) {
  const bank = getBank(bankId);
  if (!bank) return;

  const updated: BankRecord = {
    ...bank,
    adminUser: adminName,
    updatedAt: new Date().toISOString(),
  };
  updated.nextTask = nextTaskFor(updated);
  upsertBank(updated);
}

function emailDomainFromBank(bank: BankRecord) {
  const contact = bank.primaryContactEmail.trim().toLowerCase();
  if (contact.includes("@")) {
    return contact.split("@")[1] ?? `${bank.slug}.et`;
  }
  const base = bank.slug.replace(/-/g, "");
  return base ? `${base}.et` : "bank.et";
}

function uniqueAdminWorkEmail(bank: BankRecord) {
  const domain = emailDomainFromBank(bank);
  const candidates = [
    bank.primaryContactEmail.trim(),
    `bank.admin@${domain}`,
    `admin.${bank.slug}@${domain}`,
  ].filter((email) => email.includes("@"));

  for (const email of candidates) {
    const normalized = email.toLowerCase();
    const duplicate = readAdminRaw().find(
      (admin) => admin.workEmail.trim().toLowerCase() === normalized,
    );
    if (!duplicate) return email;
  }

  return `bank.admin.${bank.slug}@${domain}`;
}

function deriveDefaultBankAdminInput(bank: BankRecord): BankAdminInput {
  const primaryBranch =
    bank.branchesEnabled.split(",")[0]?.trim() || "Head Office";

  return {
    ...emptyBankAdminInput(bank.id),
    fullName: `${bank.displayName} Administrator`,
    workEmail: uniqueAdminWorkEmail(bank),
    mobileNumber: bank.tradeFinanceContact,
    username: `${bank.slug}.admin`,
    bankId: bank.id,
    primaryBranch,
  };
}

function getBankAdminForBank(bankId: string) {
  return readAdminRaw().find((admin) => admin.bankId === bankId);
}

function ensureDefaultBankAdmin(bank: BankRecord): BankAdminUser | undefined {
  const existing = getBankAdminForBank(bank.id);
  if (existing) return existing;

  const now = new Date().toISOString();
  const admin: BankAdminUser = {
    ...deriveDefaultBankAdminInput(bank),
    id: createId("admin"),
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  const saved = upsertAdmin(admin);
  linkAdminToBank(saved.bankId, saved.fullName);
  return saved;
}

export function listBankAdmins(): BankAdminUser[] {
  return readAdminRaw().sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

export function getBankAdmin(id: string): BankAdminUser | undefined {
  return readAdminRaw().find((admin) => admin.id === id);
}

function validateBankAdmin(input: BankAdminInput, forInvite: boolean) {
  const errors: string[] = [];
  if (!input.fullName.trim()) errors.push("Full name is required.");
  if (!input.workEmail.trim()) errors.push("Work email is required.");
  if (!input.username.trim()) errors.push("Temporary username is required.");
  if (!input.bankId) errors.push("Bank tenant is required.");
  if (!getBank(input.bankId)) errors.push("Selected bank tenant was not found.");
  if (forInvite && !input.primaryBranch.trim()) {
    errors.push("Primary branch is required before sending an activation invite.");
  }
  return errors;
}

export function saveBankAdminDraft(
  input: BankAdminInput,
  existingId?: string,
): { admin?: BankAdminUser; errors?: string[] } {
  const errors = validateBankAdmin(input, false);
  if (errors.length) return { errors };

  const now = new Date().toISOString();
  const existing = existingId ? getBankAdmin(existingId) : undefined;
  const duplicate = readAdminRaw().find(
    (admin) =>
      admin.workEmail.trim().toLowerCase() === input.workEmail.trim().toLowerCase() &&
      admin.id !== existingId,
  );
  if (duplicate) {
    return { errors: ["A bank admin with this work email already exists."] };
  }

  const admin: BankAdminUser = {
    ...input,
    id: existing?.id ?? createId("admin"),
    status: "draft",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  return { admin: upsertAdmin(admin) };
}

export function sendBankAdminInvite(
  input: BankAdminInput,
  existingId?: string,
): { admin?: BankAdminUser; errors?: string[] } {
  const errors = validateBankAdmin(input, true);
  if (errors.length) return { errors };

  const draft = saveBankAdminDraft(input, existingId);
  if (draft.errors?.length || !draft.admin) return draft;

  const admin: BankAdminUser = {
    ...draft.admin,
    status: "invited",
    updatedAt: new Date().toISOString(),
  };
  const saved = upsertAdmin(admin);
  linkAdminToBank(saved.bankId, saved.fullName);
  return { admin: saved };
}

export function updateBankAdmin(
  input: BankAdminInput,
  existingId: string,
): { admin?: BankAdminUser; errors?: string[] } {
  const errors = validateBankAdmin(input, false);
  if (errors.length) return { errors };

  const existing = getBankAdmin(existingId);
  if (!existing) return { errors: ["Bank admin not found."] };

  const duplicate = readAdminRaw().find(
    (admin) =>
      admin.workEmail.trim().toLowerCase() === input.workEmail.trim().toLowerCase() &&
      admin.id !== existingId,
  );
  if (duplicate) {
    return { errors: ["A bank admin with this work email already exists."] };
  }

  const now = new Date().toISOString();
  const admin: BankAdminUser = {
    ...input,
    id: existingId,
    status: existing.status,
    createdAt: existing.createdAt,
    updatedAt: now,
  };

  const saved = upsertAdmin(admin);
  if (saved.status === "active" || saved.status === "invited") {
    linkAdminToBank(saved.bankId, saved.fullName);
  }
  return { admin: saved };
}

export function deleteBankAdmin(id: string): { errors?: string[] } {
  const existing = getBankAdmin(id);
  if (!existing) return { errors: ["Bank admin not found."] };

  const remaining = readAdminRaw().filter((admin) => admin.id !== id);
  writeAdminRaw(remaining);

  const bank = getBank(existing.bankId);
  if (bank && bank.adminUser === existing.fullName) {
    const replacement = remaining.find(
      (admin) =>
        admin.bankId === existing.bankId &&
        (admin.status === "active" || admin.status === "invited"),
    );
    const updated: BankRecord = {
      ...bank,
      adminUser: replacement?.fullName ?? "Pending",
      updatedAt: new Date().toISOString(),
    };
    updated.nextTask = nextTaskFor(updated);
    upsertBank(updated);
  }

  return {};
}

export function formatBankAdminStatus(status: BankAdminStatus) {
  switch (status) {
    case "draft":
      return "Draft";
    case "invited":
      return "Invite sent";
    case "active":
      return "Active";
  }
}
