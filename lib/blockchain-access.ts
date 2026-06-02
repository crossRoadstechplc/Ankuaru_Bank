import type { UserRole } from "@/components/auth/auth-model";
import type { TradeContractRecord } from "@/lib/bank-operations-db";
import { listRbacPolicies } from "@/lib/bank-tenant-db";

export type BlockchainVerificationScope = "full" | "own-contracts" | "none";

export function getBlockchainVerificationScope(
  role: UserRole,
): BlockchainVerificationScope {
  switch (role) {
    case "BANK_VERIFIER":
    case "BANK_ADMIN":
    case "REGULATOR":
      return "full";
    case "CLIENT":
      return "own-contracts";
    default:
      return "none";
  }
}

export function canOpenBlockchainVerification(role: UserRole) {
  return getBlockchainVerificationScope(role) !== "none";
}

export function canAnchorContractsOnChain(role: UserRole) {
  return role === "BANK_VERIFIER" || role === "BANK_ADMIN";
}

export function isBlockchainVerificationReadOnly(role: UserRole) {
  return role === "REGULATOR" || role === "CLIENT";
}

export function blockchainVerificationScopeLabel(role: UserRole) {
  switch (role) {
    case "REGULATOR":
      return "Read-only · Regulator oversight";
    case "CLIENT":
      return "Read-only · Your contracts only";
    case "BANK_ADMIN":
      return "Bank admin · Full tenant lookup";
    case "BANK_VERIFIER":
      return "Credit officer · Full tenant lookup";
    default:
      return "";
  }
}

function isClientParty(partyName: string, clientLegalName: string) {
  return (
    partyName.trim().toLowerCase() === clientLegalName.trim().toLowerCase()
  );
}

export function canViewContractAnchorRecord(
  scope: BlockchainVerificationScope,
  contract: TradeContractRecord,
  clientLegalName?: string,
) {
  if (scope === "none") return false;
  if (scope === "full") return true;
  if (!clientLegalName?.trim()) return false;
  return (
    isClientParty(contract.buyer, clientLegalName) ||
    isClientParty(contract.seller, clientLegalName)
  );
}

export function bankRoleAllowsBlockchainVerification(
  bankId: string,
  role: "BANK_ADMIN" | "BANK_ONBOARDER" | "BANK_VERIFIER",
) {
  const policy = listRbacPolicies(bankId).find(
    (item) => item.role === role && item.status === "published",
  );
  if (!policy) {
    return role === "BANK_ADMIN" || role === "BANK_VERIFIER";
  }
  return policy.permissions.blockchainVerification ?? true;
}
