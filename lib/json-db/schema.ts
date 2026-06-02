import type { PlatformUserRecord } from "@/lib/platform-users-db";
import type { BankAdminUser, BankRecord } from "@/lib/bank-db";
import type {
  LetterOfCreditRecord,
  RiskAlertRecord,
  SettlementRecord,
  TradeContractRecord,
} from "@/lib/bank-operations-db";
import type {
  ClientAccountRecord,
  InternalUserRecord,
  RbacPolicyRecord,
} from "@/lib/bank-tenant-db";

export const DB_COLLECTIONS = [
  "banks",
  "bankAdmins",
  "platformUsers",
  "internalUsers",
  "clients",
  "rbacPolicies",
  "lettersOfCredit",
  "tradeContracts",
  "settlements",
  "riskAlerts",
] as const;

export type DbCollection = (typeof DB_COLLECTIONS)[number];

export type JsonDatabase = {
  banks: BankRecord[];
  bankAdmins: BankAdminUser[];
  platformUsers: PlatformUserRecord[];
  internalUsers: InternalUserRecord[];
  clients: ClientAccountRecord[];
  rbacPolicies: RbacPolicyRecord[];
  lettersOfCredit: LetterOfCreditRecord[];
  tradeContracts: TradeContractRecord[];
  settlements: SettlementRecord[];
  riskAlerts: RiskAlertRecord[];
};

export const DB_UPDATED_EVENT = "ankuaru:db-updated";
