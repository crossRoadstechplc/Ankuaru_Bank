import type { UserRole } from "@/components/auth/auth-model";
import {
  deleteBankAdmin,
  formatBankAdminStatus,
  getBank,
  listBankAdmins,
  listBanks,
  saveBankAdminDraft,
  updateBankAdmin,
  type BankAdminInput,
} from "@/lib/bank-db";
import {
  deletePlatformUser,
  formatPlatformUserStatus,
  listPlatformUsers,
  savePlatformUser,
  type PlatformUserInput,
} from "@/lib/platform-users-db";
import {
  deleteClientAccount,
  deleteInternalUser,
  formatInternalUserRole,
  formatInternalUserStatus,
  formatKycStatus,
  listClientAccounts,
  listInternalUsers,
  saveClientAccount,
  saveInternalUser,
  type ClientAccountInput,
  type InternalUserInput,
} from "@/lib/bank-tenant-db";

export const USER_ACCOUNTS_UPDATED_EVENT = "ankuaru:user-accounts-updated";

export type UserAccountKind =
  | "platform"
  | "bank_admin"
  | "internal_user"
  | "client";

export type UserAccountRow = {
  id: string;
  kind: UserAccountKind;
  name: string;
  email: string;
  role: string;
  bankId?: string;
  bankName?: string;
  status: string;
};

function bankLabel(bankId?: string) {
  if (!bankId) return "Platform";
  return getBank(bankId)?.displayName ?? "Unknown bank";
}

export function listAllUserAccounts(): UserAccountRow[] {
  const rows: UserAccountRow[] = [];

  for (const user of listPlatformUsers()) {
    rows.push({
      id: user.id,
      kind: "platform",
      name: user.name,
      email: user.email,
      role: user.roleLabel,
      bankName: user.bankName || "Platform",
      status: formatPlatformUserStatus(user.status),
    });
  }

  for (const admin of listBankAdmins()) {
    rows.push({
      id: admin.id,
      kind: "bank_admin",
      name: admin.fullName,
      email: admin.workEmail,
      role: "Bank Admin (IAM)",
      bankId: admin.bankId,
      bankName: bankLabel(admin.bankId),
      status: formatBankAdminStatus(admin.status),
    });
  }

  for (const bank of listBanks()) {
    for (const user of listInternalUsers(bank.id)) {
      rows.push({
        id: user.id,
        kind: "internal_user",
        name: user.fullName,
        email: user.workEmail,
        role: formatInternalUserRole(user.role),
        bankId: user.bankId,
        bankName: bankLabel(user.bankId),
        status: formatInternalUserStatus(user.status),
      });
    }
  }

  for (const bank of listBanks()) {
    for (const client of listClientAccounts(bank.id)) {
      rows.push({
        id: client.id,
        kind: "client",
        name: client.legalName,
        email: client.contactEmail.trim() || "—",
        role: `Client · ${client.traderType}`,
        bankId: client.bankId,
        bankName: bankLabel(client.bankId),
        status: formatKycStatus(client.kycStatus),
      });
    }
  }

  return rows.sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
  );
}

export function formatUserAccountKind(kind: UserAccountKind) {
  switch (kind) {
    case "platform":
      return "Login account";
    case "bank_admin":
      return "Bank admin IAM";
    case "internal_user":
      return "Bank staff";
    case "client":
      return "Client account";
  }
}

export function deleteUserAccount(row: UserAccountRow): { errors?: string[] } {
  switch (row.kind) {
    case "platform":
      return deletePlatformUser(row.id);
    case "bank_admin":
      return deleteBankAdmin(row.id);
    case "internal_user":
      return deleteInternalUser(row.id);
    case "client":
      return deleteClientAccount(row.id);
  }
}

export function savePlatformUserAccount(
  id: string | undefined,
  input: PlatformUserInput,
) {
  return savePlatformUser(input, id);
}

export function saveBankAdminUserAccount(
  id: string,
  input: BankAdminInput,
) {
  return updateBankAdmin(input, id);
}

export function createBankAdminUserAccount(input: BankAdminInput) {
  return saveBankAdminDraft(input);
}

export const userAccountKindOptions: {
  value: UserAccountKind;
  label: string;
  description: string;
}[] = [
  {
    value: "platform",
    label: "Login account",
    description: "Demo sign-in persona for a platform role dashboard.",
  },
  {
    value: "bank_admin",
    label: "Bank admin IAM",
    description: "Administrative user for a bank tenant.",
  },
  {
    value: "internal_user",
    label: "Bank staff",
    description: "Onboarder or verifier working inside a bank.",
  },
  {
    value: "client",
    label: "Client account",
    description: "Buyer or seller trader profile under a bank.",
  },
];

export function saveInternalUserAccount(
  id: string | undefined,
  input: InternalUserInput,
) {
  return saveInternalUser(input, id);
}

export function saveClientUserAccount(
  id: string | undefined,
  input: ClientAccountInput,
) {
  return saveClientAccount(input, id);
}

export const platformRoleOptions: { value: UserRole; label: string }[] = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "BANK_ADMIN", label: "Bank Admin" },
  { value: "BANK_ONBOARDER", label: "Bank Onboarder" },
  { value: "BANK_VERIFIER", label: "Bank Verifier" },
  { value: "CLIENT", label: "Client" },
  { value: "REGULATOR", label: "Regulator" },
];
