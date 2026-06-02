import type { UserRole } from "@/components/auth/auth-model";
import { createDefaultDatabase } from "@/lib/seeds";
import { dbGet, dbSet, persistCollection } from "@/lib/json-db/client";

export const PLATFORM_USERS_UPDATED_EVENT = "ankuaru:platform-users-updated";

export type PlatformUserStatus = "active" | "disabled";

export type PlatformUserInput = {
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  bankName?: string;
  initials: string;
  dashboardTitle: string;
  dashboardSubtitle: string;
  welcome: string;
  defaultSection: string;
  taskHint: string;
  status: PlatformUserStatus;
};

export type PlatformUserRecord = PlatformUserInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function notifyUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PLATFORM_USERS_UPDATED_EVENT));
  }
}

export function emptyPlatformUserInput(): PlatformUserInput {
  return {
    name: "",
    email: "",
    role: "CLIENT",
    roleLabel: "Client",
    bankName: "",
    initials: "",
    dashboardTitle: "Trading Dashboard",
    dashboardSubtitle: "",
    welcome: "",
    defaultSection: "portfolio",
    taskHint: "",
    status: "active",
  };
}

export function listPlatformUsers(): PlatformUserRecord[] {
  const stored = dbGet("platformUsers") ?? createDefaultDatabase().platformUsers;
  return [...stored].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

export function getPlatformUser(id: string) {
  return listPlatformUsers().find((user) => user.id === id);
}

export function savePlatformUser(
  input: PlatformUserInput,
  existingId?: string,
): { user?: PlatformUserRecord; errors?: string[] } {
  const errors: string[] = [];
  if (!input.name.trim()) errors.push("Name is required.");
  if (!input.email.trim()) errors.push("Email is required.");
  if (!input.initials.trim()) errors.push("Initials are required.");
  if (errors.length) return { errors };

  const duplicate = listPlatformUsers().find(
    (user) =>
      user.email.trim().toLowerCase() === input.email.trim().toLowerCase() &&
      user.id !== existingId,
  );
  if (duplicate) {
    return { errors: ["A platform user with this email already exists."] };
  }

  const now = new Date().toISOString();
  const existing = existingId ? getPlatformUser(existingId) : undefined;
  const user: PlatformUserRecord = {
    ...input,
    id: existing?.id ?? createId("usr"),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const users = listPlatformUsers().map((item) =>
    item.id === user.id ? user : item,
  );
  if (!existing) users.unshift(user);
  dbSet("platformUsers", users);
  notifyUpdated();
  return { user };
}

export async function persistPlatformUsers() {
  await persistCollection("platformUsers");
}

export function deletePlatformUser(id: string): { errors?: string[] } {
  const existing = getPlatformUser(id);
  if (!existing) return { errors: ["Platform user not found."] };
  if (existing.role === "SUPER_ADMIN") {
    const superAdmins = listPlatformUsers().filter(
      (user) => user.role === "SUPER_ADMIN" && user.status === "active",
    );
    if (superAdmins.length <= 1) {
      return { errors: ["At least one active Super Admin account must remain."] };
    }
  }

  dbSet(
    "platformUsers",
    listPlatformUsers().filter((user) => user.id !== id),
  );
  notifyUpdated();
  return {};
}

export function formatPlatformUserStatus(status: PlatformUserStatus) {
  return status === "active" ? "Active" : "Disabled";
}

export function toLoginUser(user: PlatformUserRecord) {
  const { status: _status, createdAt: _createdAt, updatedAt: _updatedAt, ...loginUser } =
    user;
  return loginUser;
}

export function findLoginUser(login: string, selectedRole?: UserRole) {
  const users = listPlatformUsers().filter((user) => user.status === "active");
  const normalized = login.trim().toLowerCase();

  const matched =
    users.find((user) => user.email.toLowerCase() === normalized) ??
    users.find((user) => user.role === selectedRole) ??
    users.find((user) => user.role === "BANK_ADMIN");

  return matched ? toLoginUser(matched) : undefined;
}
