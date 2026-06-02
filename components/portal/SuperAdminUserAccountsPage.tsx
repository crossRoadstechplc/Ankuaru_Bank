"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { UserRole } from "@/components/auth/auth-model";
import { roleDestinations } from "@/components/auth/auth-model";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BANKS_UPDATED_EVENT,
  BANK_ADMINS_UPDATED_EVENT,
  emptyBankAdminInput,
  getBankAdmin,
  listBanks,
  type BankAdminInput,
} from "@/lib/bank-db";
import {
  PLATFORM_USERS_UPDATED_EVENT,
  emptyPlatformUserInput,
  getPlatformUser,
  persistPlatformUsers,
  type PlatformUserInput,
} from "@/lib/platform-users-db";
import {
  TENANT_UPDATED_EVENT,
  emptyClientAccountInput,
  emptyInternalUserInput,
  listClientAccounts,
  listInternalUsers,
  type ClientAccountInput,
  type InternalUserInput,
} from "@/lib/bank-tenant-db";
import {
  createBankAdminUserAccount,
  deleteUserAccount,
  formatUserAccountKind,
  listAllUserAccounts,
  platformRoleOptions,
  saveBankAdminUserAccount,
  saveClientUserAccount,
  saveInternalUserAccount,
  savePlatformUserAccount,
  userAccountKindOptions,
  type UserAccountKind,
  type UserAccountRow,
} from "@/lib/user-accounts-db";
import { DB_UPDATED_EVENT } from "@/lib/json-db/schema";

function PageBackButton({
  onBack,
  label,
}: {
  onBack: () => void;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="legacy"
      size="legacy"
      className="role-page-back"
      onClick={onBack}
    >
      <ArrowLeft aria-hidden="true" />
      {label}
    </Button>
  );
}

function findClientById(clientId: string) {
  for (const bank of listBanks()) {
    const client = listClientAccounts(bank.id).find((item) => item.id === clientId);
    if (client) return client;
  }
  return undefined;
}

function findInternalUserById(userId: string) {
  for (const bank of listBanks()) {
    const user = listInternalUsers(bank.id).find((item) => item.id === userId);
    if (user) return user;
  }
  return undefined;
}

type EditorState =
  | { mode: "create"; kind: UserAccountKind }
  | { mode: "edit"; row: UserAccountRow };

function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function defaultPlatformFields(role: UserRole): PlatformUserInput {
  const label =
    platformRoleOptions.find((option) => option.value === role)?.label ?? role;
  return {
    ...emptyPlatformUserInput(),
    role,
    roleLabel: label,
    dashboardTitle: roleDestinations[role] ?? "ANKUARU Dashboard",
    welcome: `Welcome back, ${label}`,
    taskHint: "Platform access provisioned by Super Admin.",
    status: "active",
  };
}

export function SuperAdminUserAccountsPage({ onBack }: { onBack: () => void }) {
  const [tick, setTick] = useState(0);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [platformForm, setPlatformForm] = useState<PlatformUserInput>(() =>
    emptyPlatformUserInput(),
  );
  const [bankAdminForm, setBankAdminForm] = useState<BankAdminInput>(() =>
    emptyBankAdminInput(listBanks()[0]?.id ?? ""),
  );
  const [internalForm, setInternalForm] = useState<InternalUserInput>(() =>
    emptyInternalUserInput(listBanks()[0]?.id ?? ""),
  );
  const [clientForm, setClientForm] = useState<ClientAccountInput>(() =>
    emptyClientAccountInput(listBanks()[0]?.id ?? ""),
  );
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);

  useEffect(() => {
    function refresh() {
      setTick((current) => current + 1);
    }
    window.addEventListener(DB_UPDATED_EVENT, refresh);
    window.addEventListener(BANKS_UPDATED_EVENT, refresh);
    window.addEventListener(BANK_ADMINS_UPDATED_EVENT, refresh);
    window.addEventListener(PLATFORM_USERS_UPDATED_EVENT, refresh);
    window.addEventListener(TENANT_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener(DB_UPDATED_EVENT, refresh);
      window.removeEventListener(BANKS_UPDATED_EVENT, refresh);
      window.removeEventListener(BANK_ADMINS_UPDATED_EVENT, refresh);
      window.removeEventListener(PLATFORM_USERS_UPDATED_EVENT, refresh);
      window.removeEventListener(TENANT_UPDATED_EVENT, refresh);
    };
  }, []);

  void tick;

  const accounts = useMemo(() => listAllUserAccounts(), [tick]);
  const banks = useMemo(() => listBanks(), [tick]);
  const activeKind =
    editor?.mode === "create"
      ? editor.kind
      : editor?.mode === "edit"
        ? editor.row.kind
        : null;
  const isCreate = editor?.mode === "create";

  function resetFormsForKind(kind: UserAccountKind, bankId = banks[0]?.id ?? "") {
    if (kind === "platform") {
      setPlatformForm(defaultPlatformFields("CLIENT"));
      return;
    }
    if (kind === "bank_admin") {
      setBankAdminForm(emptyBankAdminInput(bankId));
      return;
    }
    if (kind === "internal_user") {
      setInternalForm(emptyInternalUserInput(bankId));
      return;
    }
    setClientForm(emptyClientAccountInput(bankId));
  }

  function startCreate(kind: UserAccountKind) {
    resetFormsForKind(kind);
    setEditor({ mode: "create", kind });
    setFeedback(null);
  }

  function closeEditor() {
    setEditor(null);
    setFeedback(null);
  }

  function loadRow(row: UserAccountRow) {
    setEditor({ mode: "edit", row });
    setFeedback(null);

    if (row.kind === "platform") {
      const user = getPlatformUser(row.id);
      if (!user) return;
      setPlatformForm({
        name: user.name,
        email: user.email,
        role: user.role,
        roleLabel: user.roleLabel,
        bankName: user.bankName ?? "",
        initials: user.initials,
        dashboardTitle: user.dashboardTitle,
        dashboardSubtitle: user.dashboardSubtitle,
        welcome: user.welcome,
        defaultSection: user.defaultSection,
        taskHint: user.taskHint,
        status: user.status,
      });
      return;
    }

    if (row.kind === "bank_admin") {
      const admin = getBankAdmin(row.id);
      if (!admin) return;
      setBankAdminForm({
        fullName: admin.fullName,
        workEmail: admin.workEmail,
        mobileNumber: admin.mobileNumber,
        username: admin.username,
        bankId: admin.bankId,
        primaryBranch: admin.primaryBranch,
        role: admin.role,
        permissions: { ...admin.permissions },
      });
      return;
    }

    if (row.kind === "internal_user") {
      const user = findInternalUserById(row.id);
      if (!user) return;
      setInternalForm({
        bankId: user.bankId,
        fullName: user.fullName,
        workEmail: user.workEmail,
        branchDesk: user.branchDesk,
        role: user.role,
        approvalLimit: user.approvalLimit,
        commodityScope: user.commodityScope,
        effectiveFrom: user.effectiveFrom,
        permissions: { ...user.permissions },
      });
      return;
    }

    const client = findClientById(row.id);
    if (!client) return;
    setClientForm({
      bankId: client.bankId,
      legalName: client.legalName,
      traderType: client.traderType,
      registrationTaxId: client.registrationTaxId,
      relationshipManager: client.relationshipManager,
      kycStatus: client.kycStatus,
      riskRating: client.riskRating,
      eddNotes: client.eddNotes,
      permittedCommodities: client.permittedCommodities,
      edd: { ...client.edd },
      dailyLimit: client.dailyLimit,
      perTradeLimit: client.perTradeLimit,
      totalExposureLimit: client.totalExposureLimit,
      beneficialOwner: client.beneficialOwner,
      jurisdiction: client.jurisdiction,
      contactEmail: client.contactEmail,
      preferredBank: client.preferredBank,
      documentChecks: { ...client.documentChecks },
      verificationDecision: client.verificationDecision,
      verificationNotes: client.verificationNotes,
      verificationChecklist: { ...client.verificationChecklist },
    });
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!editor || !activeKind) return;

    let result:
      | { errors?: string[]; user?: unknown; admin?: unknown; client?: unknown }
      | undefined;

    if (editor.mode === "create") {
      if (activeKind === "platform") {
        const payload = {
          ...platformForm,
          initials: platformForm.initials.trim() || initialsFromName(platformForm.name),
        };
        result = savePlatformUserAccount(undefined, payload);
        await persistPlatformUsers();
      } else if (activeKind === "bank_admin") {
        result = createBankAdminUserAccount(bankAdminForm);
      } else if (activeKind === "internal_user") {
        result = saveInternalUserAccount(undefined, internalForm);
      } else {
        result = saveClientUserAccount(undefined, clientForm);
      }
    } else if (activeKind === "platform") {
      result = savePlatformUserAccount(editor.row.id, platformForm);
      await persistPlatformUsers();
    } else if (activeKind === "bank_admin") {
      result = saveBankAdminUserAccount(editor.row.id, bankAdminForm);
    } else if (activeKind === "internal_user") {
      result = saveInternalUserAccount(editor.row.id, internalForm);
    } else {
      result = saveClientUserAccount(editor.row.id, clientForm);
    }

    if (result?.errors?.length) {
      setFeedback({ kind: "error", message: result.errors.join(" ") });
      return;
    }

    const createdName =
      activeKind === "platform"
        ? platformForm.name
        : activeKind === "bank_admin"
          ? bankAdminForm.fullName
          : activeKind === "internal_user"
            ? internalForm.fullName
            : clientForm.legalName;

    setFeedback({
      kind: "success",
      message: isCreate
        ? `${createdName} created successfully.`
        : `${editor.mode === "edit" ? editor.row.name : createdName} updated successfully.`,
    });
    setEditor(null);
    setTick((current) => current + 1);
  }

  function handleDelete(row: UserAccountRow) {
    if (
      !window.confirm(
        `Delete ${row.name} (${formatUserAccountKind(row.kind)})? This cannot be undone.`,
      )
    ) {
      return;
    }

    const result = deleteUserAccount(row);
    if (result.errors?.length) {
      setFeedback({ kind: "error", message: result.errors.join(" ") });
      return;
    }

    if (editor?.mode === "edit" && editor.row.id === row.id && editor.row.kind === row.kind) {
      setEditor(null);
    }
    setFeedback({ kind: "success", message: `${row.name} deleted.` });
    setTick((current) => current + 1);
  }

  return (
    <div className="role-panel role-page">
      <PageBackButton onBack={onBack} label="Back to Super Admin" />
      <div className="role-page__header">
        <p className="role-panel__eyebrow">PLATFORM IAM</p>
        <h2>All User Accounts</h2>
        <p>
          View and manage login accounts, bank admins, internal bank staff, and
          client trader accounts across every registered bank tenant.
        </p>
      </div>

      <div className="user-accounts-toolbar">
        <div>
          <strong>Create new account</strong>
          <p>Provision a login persona, bank admin, staff member, or client profile.</p>
        </div>
        <div className="user-accounts-toolbar__actions">
          {userAccountKindOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className="user-accounts-toolbar__btn"
              onClick={() => startCreate(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {feedback && !editor ? (
        <div
          className={`role-form__feedback role-form__feedback--${feedback.kind}`}
          style={{ marginBottom: 12 }}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="role-panel__table role-panel__table--embedded role-panel__table--user-accounts">
        <div className="role-panel__table-head">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Bank / Tenant</span>
          <span>Type</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {accounts.length === 0 ? (
          <div className="role-panel__table-row">
            <span>No accounts</span>
            <span>—</span>
            <span>—</span>
            <span>—</span>
            <span>—</span>
            <span>—</span>
            <span>—</span>
          </div>
        ) : (
          accounts.map((row) => (
            <div
              className={`role-panel__table-row${
                editor?.mode === "edit" &&
                editor.row.id === row.id &&
                editor.row.kind === row.kind
                  ? " role-panel__table-row--active"
                  : ""
              }`}
              key={`${row.kind}-${row.id}`}
            >
              <span>{row.name}</span>
              <span>{row.email}</span>
              <span>{row.role}</span>
              <span>{row.bankName ?? "—"}</span>
              <span>{formatUserAccountKind(row.kind)}</span>
              <span>{row.status}</span>
              <span className="role-table-actions">
                <button type="button" onClick={() => loadRow(row)}>
                  Edit
                </button>
                <button type="button" onClick={() => handleDelete(row)}>
                  Delete
                </button>
              </span>
            </div>
          ))
        )}
      </div>

      {editor && activeKind ? (
        <form className="role-form" onSubmit={handleSave}>
          <section className="role-form__section role-form__section--wide">
            <h3>
              {isCreate
                ? `Create ${formatUserAccountKind(activeKind).toLowerCase()}`
                : `Edit ${editor.mode === "edit" ? editor.row.name : ""} · ${formatUserAccountKind(activeKind)}`}
            </h3>
            {isCreate ? (
              <p className="role-form__hint">
                {
                  userAccountKindOptions.find((option) => option.value === activeKind)
                    ?.description
                }
              </p>
            ) : null}

            {activeKind === "platform" ? (
              <div className="role-form__inline-grid">
                <label>
                  <span>Full name</span>
                  <Input
                    value={platformForm.name}
                    onChange={(event) =>
                      setPlatformForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Email</span>
                  <Input
                    type="email"
                    value={platformForm.email}
                    onChange={(event) =>
                      setPlatformForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Role</span>
                  <select
                    value={platformForm.role}
                    onChange={(event) => {
                      const role = event.target.value as UserRole;
                      const label =
                        platformRoleOptions.find((item) => item.value === role)
                          ?.label ?? role;
                      setPlatformForm((current) => ({
                        ...current,
                        role,
                        roleLabel: label,
                        dashboardTitle: roleDestinations[role] ?? current.dashboardTitle,
                        welcome: `Welcome back, ${label}`,
                      }));
                    }}
                  >
                    {platformRoleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Bank name (optional)</span>
                  <Input
                    value={platformForm.bankName ?? ""}
                    onChange={(event) =>
                      setPlatformForm((current) => ({
                        ...current,
                        bankName: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Initials</span>
                  <Input
                    value={platformForm.initials}
                    onChange={(event) =>
                      setPlatformForm((current) => ({
                        ...current,
                        initials: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Status</span>
                  <select
                    value={platformForm.status}
                    onChange={(event) =>
                      setPlatformForm((current) => ({
                        ...current,
                        status: event.target.value as PlatformUserInput["status"],
                      }))
                    }
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </label>
              </div>
            ) : null}

            {activeKind === "bank_admin" ? (
              <div className="role-form__inline-grid">
                <label>
                  <span>Full name</span>
                  <Input
                    value={bankAdminForm.fullName}
                    onChange={(event) =>
                      setBankAdminForm((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Work email</span>
                  <Input
                    type="email"
                    value={bankAdminForm.workEmail}
                    onChange={(event) =>
                      setBankAdminForm((current) => ({
                        ...current,
                        workEmail: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Username</span>
                  <Input
                    value={bankAdminForm.username}
                    onChange={(event) =>
                      setBankAdminForm((current) => ({
                        ...current,
                        username: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Bank tenant</span>
                  <select
                    value={bankAdminForm.bankId}
                    onChange={(event) =>
                      setBankAdminForm((current) => ({
                        ...current,
                        bankId: event.target.value,
                      }))
                    }
                  >
                    {banks.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.displayName}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Primary branch</span>
                  <Input
                    value={bankAdminForm.primaryBranch}
                    onChange={(event) =>
                      setBankAdminForm((current) => ({
                        ...current,
                        primaryBranch: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Mobile</span>
                  <Input
                    value={bankAdminForm.mobileNumber}
                    onChange={(event) =>
                      setBankAdminForm((current) => ({
                        ...current,
                        mobileNumber: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            ) : null}

            {activeKind === "internal_user" ? (
              <div className="role-form__inline-grid">
                <label>
                  <span>Full name</span>
                  <Input
                    value={internalForm.fullName}
                    onChange={(event) =>
                      setInternalForm((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Work email</span>
                  <Input
                    type="email"
                    value={internalForm.workEmail}
                    onChange={(event) =>
                      setInternalForm((current) => ({
                        ...current,
                        workEmail: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Role</span>
                  <select
                    value={internalForm.role}
                    onChange={(event) =>
                      setInternalForm((current) => ({
                        ...current,
                        role: event.target.value as InternalUserInput["role"],
                      }))
                    }
                  >
                    <option value="BANK_ONBOARDER">Onboarder</option>
                    <option value="BANK_VERIFIER">Verifier</option>
                  </select>
                </label>
                <label>
                  <span>Bank tenant</span>
                  <select
                    value={internalForm.bankId}
                    onChange={(event) =>
                      setInternalForm((current) => ({
                        ...current,
                        bankId: event.target.value,
                      }))
                    }
                  >
                    {banks.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.displayName}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Branch / desk</span>
                  <Input
                    value={internalForm.branchDesk}
                    onChange={(event) =>
                      setInternalForm((current) => ({
                        ...current,
                        branchDesk: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Approval limit</span>
                  <Input
                    value={internalForm.approvalLimit}
                    onChange={(event) =>
                      setInternalForm((current) => ({
                        ...current,
                        approvalLimit: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            ) : null}

            {activeKind === "client" ? (
              <div className="role-form__inline-grid">
                <label>
                  <span>Legal name</span>
                  <Input
                    value={clientForm.legalName}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        legalName: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Contact email</span>
                  <Input
                    type="email"
                    value={clientForm.contactEmail}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        contactEmail: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Trader type</span>
                  <select
                    value={clientForm.traderType}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        traderType: event.target.value as ClientAccountInput["traderType"],
                      }))
                    }
                  >
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="both">Both</option>
                  </select>
                </label>
                <label>
                  <span>KYC status</span>
                  <select
                    value={clientForm.kycStatus}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        kycStatus: event.target.value as ClientAccountInput["kycStatus"],
                      }))
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </label>
                <label>
                  <span>Bank tenant</span>
                  <select
                    value={clientForm.bankId}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        bankId: event.target.value,
                      }))
                    }
                  >
                    {banks.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.displayName}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Relationship manager</span>
                  <Input
                    value={clientForm.relationshipManager}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        relationshipManager: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            ) : null}
          </section>

          {feedback ? (
            <div
              className={`role-form__feedback role-form__feedback--${feedback.kind}`}
            >
              {feedback.message}
            </div>
          ) : null}

          <div className="role-form__actions">
            <Button
              type="button"
              variant="legacy"
              size="legacy"
              onClick={closeEditor}
            >
              Cancel
            </Button>
            <Button type="submit" variant="legacy" size="legacy">
              {isCreate ? "Create account" : "Save changes"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
