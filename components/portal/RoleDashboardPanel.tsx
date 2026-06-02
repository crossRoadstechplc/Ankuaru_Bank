"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  BriefcaseBusiness,
  FileImage,
  FileText,
  KeyRound,
  Link2,
  Repeat2,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { AuthSession } from "@/components/auth/auth-model";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { callLegacy } from "./legacy-actions";
import { SuperAdminUserAccountsPage } from "./SuperAdminUserAccountsPage";
import {
  BankOperationsListPage,
  ClientRegistrationPage,
  ClientStatusPage,
  GenerateContractPage,
  IssueLetterOfCreditPage,
  ManageClientsPage,
  RegisterAndOnboardClientPage,
  SuperAdminBankDirectoryPage,
  VerificationPage,
} from "./BankOpsPages";
import { BankDocumentAssetsPage } from "./BankDocumentAssetsPage";
import { ContractAnchorVerificationPage } from "./ContractAnchorVerificationPage";
import {
  BANK_ADMINS_UPDATED_EVENT,
  BANKS_UPDATED_EVENT,
  BankAdminInput,
  BankAdminUser,
  BankRegistrationInput,
  BankRecord,
  emptyBankAdminInput,
  emptyBankRegistration,
  approveBank,
  formatBankAdminStatus,
  formatBankStatus,
  listBankAdmins,
  listBanks,
  reactivateBank,
  saveBankAdminDraft,
  saveBankDraft,
  sendBankAdminInvite,
  submitBankForReview,
  suspendBank,
  updateBankAdmin,
  deleteBankAdmin,
} from "@/lib/bank-db";
import { getClientTradeSummary } from "@/lib/bank-operations-db";
import { CONTRACT_ANCHOR_PAGE_EVENT } from "@/lib/contract-anchor-nav";
import {
  blockchainVerificationScopeLabel,
  canOpenBlockchainVerification,
  getBlockchainVerificationScope,
} from "@/lib/blockchain-access";
import {
  ClientAccountInput,
  ClientAccountRecord,
  InternalUserInput,
  RbacPolicyInput,
  TENANT_UPDATED_EVENT,
  activateClientAccount,
  deleteClientAccount,
  emptyClientAccountInput,
  emptyInternalUserInput,
  emptyRbacPolicyInput,
  findClientByName,
  formatInternalUserRole,
  formatInternalUserStatus,
  formatKycStatus,
  formatClientTradingLimit,
  formatTraderType,
  getTenantStats,
  listClientAccounts,
  listInternalUsers,
  listRbacPolicies,
  rbacMatrixRows,
  resolveBankId,
  saveClientAccount,
  saveInternalUser,
  saveRbacPolicy,
  submitClientKyc,
} from "@/lib/bank-tenant-db";

type SuperAdminPage =
  | "home"
  | "bank-registration"
  | "bank-admin"
  | "bank-directory"
  | "user-accounts";
type BankAdminPageKey =
  | "home"
  | "internal-users"
  | "client-accounts"
  | "rbac"
  | "document-assets"
  | "contract-anchor"
  | "contracts"
  | "settlement"
  | "actors"
  | "risk";
type OnboarderPageKey = "home" | "register-client" | "manage-clients";
type VerifierPageKey =
  | "home"
  | "register-client"
  | "manage-clients"
  | "verification"
  | "issue-lc"
  | "generate-contract"
  | "contract-anchor";
type ClientPageKey = "home" | "registration" | "status" | "contract-anchor";
type RegulatorPageKey = "home" | "contracts" | "settlement" | "contract-anchor";

function PageBackButton({
  onBack,
  label = "Back to Super Admin",
}: {
  onBack: () => void;
  label?: string;
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

function BankRegistrationPage({
  onBack,
  onSaved,
}: {
  onBack: () => void;
  onSaved?: () => void;
}) {
  const [form, setForm] = useState<BankRegistrationInput>(
    emptyBankRegistration,
  );
  const [bankId, setBankId] = useState<string | undefined>();
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);

  function updateField<K extends keyof BankRegistrationInput>(
    key: K,
    value: BankRegistrationInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateDocument(
    key: keyof BankRegistrationInput["documents"],
    checked: boolean,
  ) {
    setForm((current) => ({
      ...current,
      documents: { ...current.documents, [key]: checked },
    }));
  }

  function handleSaveDraft() {
    const result = saveBankDraft(form, bankId);
    if (result.errors?.length) {
      setFeedback({ kind: "error", message: result.errors.join(" ") });
      return;
    }
    if (result.bank) {
      setBankId(result.bank.id);
      const adminNote = result.admin
        ? ` Default Bank Admin activated (${result.admin.workEmail}).`
        : "";
      setFeedback({
        kind: "success",
        message: `Draft saved for ${result.bank.displayName}.${adminNote}`,
      });
      onSaved?.();
    }
  }

  function handleSubmitReview() {
    const result = submitBankForReview(form, bankId);
    if (result.errors?.length) {
      setFeedback({ kind: "error", message: result.errors.join(" ") });
      return;
    }
    if (result.bank) {
      setBankId(result.bank.id);
      const adminNote = result.admin
        ? ` Default Bank Admin activated (${result.admin.workEmail}).`
        : "";
      setFeedback({
        kind: "success",
        message: `${result.bank.displayName} submitted for compliance review.${adminNote}`,
      });
      onSaved?.();
    }
  }

  return (
    <div className="role-panel role-page">
      <PageBackButton onBack={onBack} />
      <div className="role-page__header">
        <p className="role-panel__eyebrow">BANK REGISTRY</p>
        <h2>New Bank Registration</h2>
        <p>
          Register a licensed bank, capture legal and regulatory details, and
          prepare the tenant for Bank Admin creation.
        </p>
      </div>
      <form
        className="role-form"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmitReview();
        }}
      >
        <section className="role-form__section">
          <h3>Legal Details</h3>
          <label>
            <span>Legal Bank Name</span>
            <Input
              placeholder="e.g. Abay Bank S.C."
              value={form.legalName}
              onChange={(event) => updateField("legalName", event.target.value)}
            />
          </label>
          <label>
            <span>License Number</span>
            <Input
              placeholder="NBE-BNK-0000"
              value={form.licenseNumber}
              onChange={(event) =>
                updateField("licenseNumber", event.target.value)
              }
            />
          </label>
          <label>
            <span>Tax Identification Number</span>
            <Input
              placeholder="TIN / VAT number"
              value={form.taxIdentificationNumber}
              onChange={(event) =>
                updateField("taxIdentificationNumber", event.target.value)
              }
            />
          </label>
          <label>
            <span>Head Office City</span>
            <Input
              placeholder="Addis Ababa"
              value={form.headOfficeCity}
              onChange={(event) =>
                updateField("headOfficeCity", event.target.value)
              }
            />
          </label>
          <label>
            <span>Regulator Status</span>
            <select
              value={form.regulatorStatus}
              onChange={(event) =>
                updateField(
                  "regulatorStatus",
                  event.target
                    .value as BankRegistrationInput["regulatorStatus"],
                )
              }
            >
              <option value="licensed">Licensed by NBE</option>
              <option value="pending">Pending verification</option>
              <option value="restricted">Restricted / conditional</option>
            </select>
          </label>
          <label>
            <span>Data Residency Region</span>
            <Input
              placeholder="Ethiopia / Addis Ababa DC"
              value={form.dataResidencyRegion}
              onChange={(event) =>
                updateField("dataResidencyRegion", event.target.value)
              }
            />
          </label>
        </section>

        <section className="role-form__section">
          <h3>Bank Profile</h3>
          <label>
            <span>Display Name</span>
            <Input
              placeholder="Abay Bank"
              value={form.displayName}
              onChange={(event) =>
                updateField("displayName", event.target.value)
              }
            />
          </label>
          <label>
            <span>Logo URL</span>
            <Input
              placeholder="https://bank.et/logo.svg"
              value={form.logoUrl}
              onChange={(event) => updateField("logoUrl", event.target.value)}
            />
          </label>
          <label>
            <span>Supported Commodities</span>
            <Input
              placeholder="Coffee, sesame, pulses"
              value={form.supportedCommodities}
              onChange={(event) =>
                updateField("supportedCommodities", event.target.value)
              }
            />
          </label>
          <label>
            <span>Supported Currencies</span>
            <Input
              placeholder="ETB, USD, EUR"
              value={form.supportedCurrencies}
              onChange={(event) =>
                updateField("supportedCurrencies", event.target.value)
              }
            />
          </label>
          <label>
            <span>Primary Contact Email</span>
            <Input
              type="email"
              placeholder="tradefinance@bank.et"
              value={form.primaryContactEmail}
              onChange={(event) =>
                updateField("primaryContactEmail", event.target.value)
              }
            />
          </label>
          <label>
            <span>Branches Enabled</span>
            <Input
              placeholder="Main, Bole, Modjo"
              value={form.branchesEnabled}
              onChange={(event) =>
                updateField("branchesEnabled", event.target.value)
              }
            />
          </label>
          <label>
            <span>Trade Finance Contact</span>
            <Input
              placeholder="+251 11 ..."
              value={form.tradeFinanceContact}
              onChange={(event) =>
                updateField("tradeFinanceContact", event.target.value)
              }
            />
          </label>
        </section>

        <section className="role-form__section role-form__section--wide">
          <h3>Required Documents</h3>
          <div className="role-check-grid">
            <label>
              <input
                type="checkbox"
                checked={form.documents.bankingLicense}
                onChange={(event) =>
                  updateDocument("bankingLicense", event.target.checked)
                }
              />
              Banking license uploaded
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.documents.incorporation}
                onChange={(event) =>
                  updateDocument("incorporation", event.target.checked)
                }
              />
              Incorporation document uploaded
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.documents.boardResolution}
                onChange={(event) =>
                  updateDocument("boardResolution", event.target.checked)
                }
              />
              Board resolution uploaded
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.documents.apiSecurityQuestionnaire}
                onChange={(event) =>
                  updateDocument(
                    "apiSecurityQuestionnaire",
                    event.target.checked,
                  )
                }
              />
              API security questionnaire uploaded
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.documents.authorizedSignatoryList}
                onChange={(event) =>
                  updateDocument(
                    "authorizedSignatoryList",
                    event.target.checked,
                  )
                }
              />
              Authorized signatory list uploaded
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.documents.amlCftPolicy}
                onChange={(event) =>
                  updateDocument("amlCftPolicy", event.target.checked)
                }
              />
              AML/CFT policy uploaded
            </label>
          </div>
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
            onClick={handleSaveDraft}
          >
            Save Draft
          </Button>
          <Button type="submit" variant="legacy" size="legacy">
            Submit for Compliance Review
          </Button>
        </div>
      </form>
    </div>
  );
}

function BankAdminPage({
  banks,
  onBack,
  onSaved,
}: {
  banks: BankRecord[];
  onBack: () => void;
  onSaved?: () => void;
}) {
  const [form, setForm] = useState<BankAdminInput>(() =>
    emptyBankAdminInput(banks[0]?.id ?? ""),
  );
  const [adminId, setAdminId] = useState<string | undefined>();
  const [admins, setAdmins] = useState<BankAdminUser[]>(() => listBankAdmins());
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!form.bankId && banks[0]?.id) {
      setForm((current) => ({ ...current, bankId: banks[0].id }));
    }
  }, [banks, form.bankId]);

  useEffect(() => {
    function refreshAdmins() {
      setAdmins(listBankAdmins());
    }

    refreshAdmins();
    window.addEventListener(BANK_ADMINS_UPDATED_EVENT, refreshAdmins);
    return () => {
      window.removeEventListener(BANK_ADMINS_UPDATED_EVENT, refreshAdmins);
    };
  }, []);

  function updateField<K extends keyof BankAdminInput>(
    key: K,
    value: BankAdminInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updatePermission(
    key: keyof BankAdminInput["permissions"],
    checked: boolean,
  ) {
    setForm((current) => ({
      ...current,
      permissions: { ...current.permissions, [key]: checked },
    }));
  }

  function resetForm() {
    setAdminId(undefined);
    setForm(emptyBankAdminInput(banks[0]?.id ?? ""));
  }

  function loadAdminForEdit(admin: BankAdminUser) {
    setAdminId(admin.id);
    setForm({
      fullName: admin.fullName,
      workEmail: admin.workEmail,
      mobileNumber: admin.mobileNumber,
      username: admin.username,
      bankId: admin.bankId,
      primaryBranch: admin.primaryBranch,
      role: admin.role,
      permissions: { ...admin.permissions },
    });
    setFeedback({
      kind: "success",
      message: `Editing ${admin.fullName}. Save changes or delete below.`,
    });
  }

  function handleSaveChanges() {
    if (!adminId) {
      handleSaveDraft();
      return;
    }

    const result = updateBankAdmin(form, adminId);
    if (result.errors?.length) {
      setFeedback({ kind: "error", message: result.errors.join(" ") });
      return;
    }
    if (result.admin) {
      setFeedback({
        kind: "success",
        message: `Updated ${result.admin.fullName}.`,
      });
      onSaved?.();
    }
  }

  function handleDeleteAdmin(id: string, name: string) {
    if (!window.confirm(`Delete bank admin ${name}?`)) return;

    const result = deleteBankAdmin(id);
    if (result.errors?.length) {
      setFeedback({ kind: "error", message: result.errors.join(" ") });
      return;
    }

    if (adminId === id) resetForm();
    setFeedback({ kind: "success", message: `${name} removed.` });
    onSaved?.();
  }

  function handleSaveDraft() {
    const result = saveBankAdminDraft(form, adminId);
    if (result.errors?.length) {
      setFeedback({ kind: "error", message: result.errors.join(" ") });
      return;
    }
    if (result.admin) {
      setAdminId(result.admin.id);
      setFeedback({
        kind: "success",
        message: `Draft saved for ${result.admin.fullName}.`,
      });
      onSaved?.();
    }
  }

  function handleSendInvite() {
    const result = sendBankAdminInvite(form, adminId);
    if (result.errors?.length) {
      setFeedback({ kind: "error", message: result.errors.join(" ") });
      return;
    }
    if (result.admin) {
      setAdminId(result.admin.id);
      const bankName =
        banks.find((bank) => bank.id === result.admin?.bankId)?.displayName ??
        "selected bank";
      setFeedback({
        kind: "success",
        message: `Activation invite sent to ${result.admin.workEmail} for ${bankName}.`,
      });
      onSaved?.();
    }
  }

  return (
    <div className="role-panel role-page">
      <PageBackButton onBack={onBack} />
      <div className="role-page__header">
        <p className="role-panel__eyebrow">BANK IAM</p>
        <h2>Create Bank Admin User</h2>
        <p>
          Assign the first administrative user for a bank tenant with full
          bank-level permissions and branch scope.
        </p>
      </div>
      <form
        className="role-form"
        onSubmit={(event) => {
          event.preventDefault();
          handleSendInvite();
        }}
      >
        <section className="role-form__section">
          <h3>User Identity</h3>
          <label>
            <span>Full Name</span>
            <Input
              placeholder="Mekdes Alemu"
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
            />
          </label>
          <label>
            <span>Work Email</span>
            <Input
              type="email"
              placeholder="admin@bank.et"
              value={form.workEmail}
              onChange={(event) => updateField("workEmail", event.target.value)}
            />
          </label>
          <label>
            <span>Mobile Number</span>
            <Input
              placeholder="+251..."
              value={form.mobileNumber}
              onChange={(event) =>
                updateField("mobileNumber", event.target.value)
              }
            />
          </label>
          <label>
            <span>Temporary Username</span>
            <Input
              placeholder="bank.admin"
              value={form.username}
              onChange={(event) => updateField("username", event.target.value)}
            />
          </label>
        </section>

        <section className="role-form__section">
          <h3>Bank Scope</h3>
          <label>
            <span>Bank Tenant</span>
            <select
              value={form.bankId}
              onChange={(event) => updateField("bankId", event.target.value)}
            >
              {banks.length === 0 ? (
                <option value="">No banks registered yet</option>
              ) : (
                banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.displayName}
                  </option>
                ))
              )}
            </select>
          </label>
          <label>
            <span>Primary Branch</span>
            <Input
              placeholder="Head Office"
              value={form.primaryBranch}
              onChange={(event) =>
                updateField("primaryBranch", event.target.value)
              }
            />
          </label>
          <label>
            <span>Role</span>
            <select value={form.role} disabled>
              <option value="BANK_ADMIN">Bank Admin</option>
            </select>
          </label>
        </section>

        <section className="role-form__section role-form__section--wide">
          <h3>Permissions</h3>
          <div className="role-check-grid">
            <label>
              <input
                type="checkbox"
                checked={form.permissions.manageBankProfile}
                onChange={(event) =>
                  updatePermission("manageBankProfile", event.target.checked)
                }
              />
              Manage bank profile
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.permissions.manageBankUsers}
                onChange={(event) =>
                  updatePermission("manageBankUsers", event.target.checked)
                }
              />
              Manage bank users
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.permissions.manageClientsAndLimits}
                onChange={(event) =>
                  updatePermission(
                    "manageClientsAndLimits",
                    event.target.checked,
                  )
                }
              />
              Manage clients and limits
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.permissions.viewAuditLogs}
                onChange={(event) =>
                  updatePermission("viewAuditLogs", event.target.checked)
                }
              />
              View audit logs and reports
            </label>
          </div>
        </section>

        <section className="role-form__section role-form__section--wide">
          <h3>Registered Bank Admins</h3>
          <div className="role-panel__table role-panel__table--embedded role-panel__table--bank-admins">
            <div className="role-panel__table-head">
              <span>User</span>
              <span>Bank</span>
              <span>Status</span>
              <span>Email</span>
              <span>Actions</span>
            </div>
            {admins.length === 0 ? (
              <div className="role-panel__table-row">
                <span>No bank admins yet</span>
                <span>—</span>
                <span>—</span>
                <span>—</span>
                <span>—</span>
              </div>
            ) : (
              admins.map((admin) => (
                <div className="role-panel__table-row" key={admin.id}>
                  <span>{admin.fullName}</span>
                  <span>
                    {banks.find((bank) => bank.id === admin.bankId)
                      ?.displayName ?? "Unknown bank"}
                  </span>
                  <span>{formatBankAdminStatus(admin.status)}</span>
                  <span>{admin.workEmail}</span>
                  <span className="role-table-actions">
                    <button
                      type="button"
                      onClick={() => loadAdminForEdit(admin)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAdmin(admin.id, admin.fullName)}
                    >
                      Delete
                    </button>
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {feedback ? (
          <div
            className={`role-form__feedback role-form__feedback--${feedback.kind}`}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="role-form__actions">
          {adminId ? (
            <Button
              type="button"
              variant="legacy"
              size="legacy"
              onClick={resetForm}
            >
              Cancel Edit
            </Button>
          ) : null}
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            onClick={handleSaveChanges}
            disabled={banks.length === 0}
          >
            {adminId ? "Save Changes" : "Create User Draft"}
          </Button>
          {!adminId ? (
            <Button
              type="submit"
              variant="legacy"
              size="legacy"
              disabled={banks.length === 0}
            >
              Send Activation Invite
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function BankRegistryActions({
  bank,
  onAction,
}: {
  bank: BankRecord;
  onAction: (message: { kind: "error" | "success"; text: string }) => void;
}) {
  function run(
    action: () => { bank?: BankRecord; errors?: string[] },
    successMessage: string,
  ) {
    const result = action();
    if (result.errors?.length) {
      onAction({ kind: "error", text: result.errors.join(" ") });
      return;
    }
    onAction({ kind: "success", text: successMessage });
  }

  return (
    <div className="role-table-actions">
      {(bank.status === "draft" || bank.status === "pending_review") && (
        <Button
          type="button"
          variant="legacy"
          size="legacy"
          onClick={() =>
            run(
              () => approveBank(bank.id),
              `${bank.displayName} approved and set to Active.`,
            )
          }
        >
          Approve
        </Button>
      )}
      {bank.status === "active" && (
        <Button
          type="button"
          variant="legacy"
          size="legacy"
          onClick={() =>
            run(() => suspendBank(bank.id), `${bank.displayName} suspended.`)
          }
        >
          Suspend
        </Button>
      )}
      {bank.status === "suspended" && (
        <Button
          type="button"
          variant="legacy"
          size="legacy"
          onClick={() =>
            run(
              () => reactivateBank(bank.id),
              `${bank.displayName} reactivated.`,
            )
          }
        >
          Reactivate
        </Button>
      )}
    </div>
  );
}

function SuperAdminPanel() {
  const [page, setPage] = useState<SuperAdminPage>("home");
  const [banks, setBanks] = useState<BankRecord[]>(() => listBanks());
  const [actionFeedback, setActionFeedback] = useState<{
    kind: "error" | "success";
    text: string;
  } | null>(null);
  const stats = useMemo(
    () => ({
      registered: banks.length,
      pendingReview: banks.filter((bank) => bank.status === "pending_review")
        .length,
      bankAdminUsers: banks.filter((bank) => bank.adminUser !== "Pending")
        .length,
      activeBanks: banks.filter((bank) => bank.status === "active").length,
    }),
    [banks],
  );

  useEffect(() => {
    function refreshBanks() {
      setBanks(listBanks());
    }

    refreshBanks();
    window.addEventListener(BANKS_UPDATED_EVENT, refreshBanks);
    window.addEventListener(BANK_ADMINS_UPDATED_EVENT, refreshBanks);

    return () => {
      window.removeEventListener(BANKS_UPDATED_EVENT, refreshBanks);
      window.removeEventListener(BANK_ADMINS_UPDATED_EVENT, refreshBanks);
    };
  }, []);

  useEffect(() => {
    function handleNavigate(event: Event) {
      const nextPage = (event as CustomEvent<SuperAdminPage>).detail;
      if (nextPage) setPage(nextPage);
    }

    window.addEventListener("ankuaru:super-admin-page", handleNavigate);

    return () => {
      window.removeEventListener("ankuaru:super-admin-page", handleNavigate);
    };
  }, []);

  if (page === "bank-registration") {
    return (
      <BankRegistrationPage
        onBack={() => setPage("home")}
        onSaved={() => setBanks(listBanks())}
      />
    );
  }

  if (page === "bank-admin") {
    return (
      <BankAdminPage
        banks={banks}
        onBack={() => setPage("home")}
        onSaved={() => setBanks(listBanks())}
      />
    );
  }

  if (page === "bank-directory") {
    return <SuperAdminBankDirectoryPage onBack={() => setPage("home")} />;
  }

  if (page === "user-accounts") {
    return <SuperAdminUserAccountsPage onBack={() => setPage("home")} />;
  }

  return (
    <div className="role-panel role-panel--super-admin">
      <div className="role-panel__header">
        <div>
          <p className="role-panel__eyebrow">ANKUARU SUPER ADMIN</p>
          <h2>Bank Registry & Bank Admin Users</h2>
          <p>
            Register licensed banks and create their first Bank Admin users.
          </p>
        </div>
        <div className="role-panel__badge">
          <ShieldCheck aria-hidden="true" />
          Platform root
        </div>
      </div>

      <div className="role-panel__metrics">
        <div>
          <span>Registered Banks</span>
          <strong>{stats.registered}</strong>
        </div>
        <div>
          <span>Pending Review</span>
          <strong>{stats.pendingReview}</strong>
        </div>
        <div>
          <span>Bank Admin Users</span>
          <strong>{stats.bankAdminUsers}</strong>
        </div>
        <div>
          <span>Active Banks</span>
          <strong>{stats.activeBanks}</strong>
        </div>
      </div>

      <div className="role-panel__grid">
        <section className="role-action-card">
          <div className="role-action-card__icon">
            <Building2 aria-hidden="true" />
          </div>
          <div>
            <h3>Register Bank</h3>
            <p>
              Capture legal name, license number, regulatory documents,
              supported commodities, currencies, branches, and contact details.
            </p>
          </div>
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            onClick={() => setPage("bank-registration")}
          >
            New Bank Registration
          </Button>
        </section>

        <section className="role-action-card">
          <div className="role-action-card__icon">
            <UserPlus aria-hidden="true" />
          </div>
          <div>
            <h3>Create Bank Admin User</h3>
            <p>
              Assign the first Bank Admin with MFA-ready identity, bank tenant,
              branch scope, and full bank-management RBAC permissions.
            </p>
          </div>
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            onClick={() => setPage("bank-admin")}
          >
            Create Bank Admin
          </Button>
        </section>

        <section className="role-action-card">
          <div className="role-action-card__icon">
            <UsersRound aria-hidden="true" />
          </div>
          <div>
            <h3>All User Accounts</h3>
            <p>
              View every login account, bank admin, internal staff member, and
              client trader with edit and delete controls.
            </p>
          </div>
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            onClick={() => setPage("user-accounts")}
          >
            Manage Users
          </Button>
        </section>

        <section className="role-action-card">
          <div className="role-action-card__icon">
            <BriefcaseBusiness aria-hidden="true" />
          </div>
          <div>
            <h3>Banks, Clients & Staff</h3>
            <p>
              Browse registered banks, then open a bank to view its internal
              users and client accounts.
            </p>
          </div>
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            onClick={() => setPage("bank-directory")}
          >
            Open Directory
          </Button>
        </section>
      </div>

      {actionFeedback ? (
        <div
          className={`role-form__feedback role-form__feedback--${actionFeedback.kind}`}
        >
          {actionFeedback.text}
        </div>
      ) : null}

      <div className="role-panel__table role-panel__table--registry">
        <div className="role-panel__table-head">
          <span>Bank</span>
          <span>Admin User</span>
          <span>Status</span>
          <span>Next Task</span>
          <span>Actions</span>
        </div>
        {banks.length === 0 ? (
          <div className="role-panel__table-row">
            <span>No banks registered yet</span>
            <span>—</span>
            <span>—</span>
            <span>Register your first bank</span>
            <span>—</span>
          </div>
        ) : (
          banks.map((bank) => (
            <div className="role-panel__table-row" key={bank.id}>
              <span>{bank.displayName}</span>
              <span>{bank.adminUser}</span>
              <span>{formatBankStatus(bank.status)}</span>
              <span>{bank.nextTask}</span>
              <BankRegistryActions
                bank={bank}
                onAction={(message) => {
                  setActionFeedback(message);
                  setBanks(listBanks());
                }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function BankTenantNotice({ bankName }: { bankName?: string }) {
  return (
    <div className="role-form__feedback role-form__feedback--error">
      Could not resolve a bank tenant for {bankName ?? "this session"}. Register
      the bank in Super Admin first, or clear local storage and reload seed
      data.
    </div>
  );
}

function BankInternalUsersPage({
  bankId,
  onBack,
  onSaved,
}: {
  bankId: string;
  onBack: () => void;
  onSaved?: () => void;
}) {
  const [form, setForm] = useState<InternalUserInput>(() =>
    emptyInternalUserInput(bankId),
  );
  const [userId, setUserId] = useState<string | undefined>();
  const [users, setUsers] = useState(() => listInternalUsers(bankId));
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);

  useEffect(() => {
    function refreshUsers() {
      setUsers(listInternalUsers(bankId));
    }
    refreshUsers();
    window.addEventListener(TENANT_UPDATED_EVENT, refreshUsers);
    return () => window.removeEventListener(TENANT_UPDATED_EVENT, refreshUsers);
  }, [bankId]);

  function updateField<K extends keyof InternalUserInput>(
    key: K,
    value: InternalUserInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updatePermission(
    key: keyof InternalUserInput["permissions"],
    checked: boolean,
  ) {
    setForm((current) => ({
      ...current,
      permissions: { ...current.permissions, [key]: checked },
    }));
  }

  function handleSave(invite: boolean) {
    const result = saveInternalUser(form, userId, invite);
    if (result.errors?.length) {
      setFeedback({ kind: "error", message: result.errors.join(" ") });
      return;
    }
    if (result.user) {
      setUserId(result.user.id);
      setFeedback({
        kind: "success",
        message: invite
          ? `Invite sent to ${result.user.workEmail}.`
          : `Saved ${result.user.fullName} as draft.`,
      });
      onSaved?.();
    }
  }

  return (
    <div className="role-panel role-page">
      <PageBackButton onBack={onBack} label="Back to Bank Admin" />
      <div className="role-page__header">
        <p className="role-panel__eyebrow">BANK IAM</p>
        <h2>Internal Users & Roles</h2>
        <p>
          Create and manage bank staff with scoped roles: Onboarder and
          Verifier.
        </p>
      </div>
      <form
        className="role-form"
        onSubmit={(event) => {
          event.preventDefault();
          handleSave(true);
        }}
      >
        <section className="role-form__section">
          <h3>Create Internal User</h3>
          <label>
            <span>Full Name</span>
            <Input
              placeholder="Hana Bekele"
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
            />
          </label>
          <label>
            <span>Work Email</span>
            <Input
              type="email"
              placeholder="hana@abaybank.et"
              value={form.workEmail}
              onChange={(event) => updateField("workEmail", event.target.value)}
            />
          </label>
          <label>
            <span>Branch / Desk</span>
            <Input
              placeholder="Trade Finance · Head Office"
              value={form.branchDesk}
              onChange={(event) =>
                updateField("branchDesk", event.target.value)
              }
            />
          </label>
        </section>

        <section className="role-form__section">
          <h3>Role Assignment</h3>
          <label>
            <span>Primary Role</span>
            <select
              value={form.role}
              onChange={(event) =>
                updateField(
                  "role",
                  event.target.value as InternalUserInput["role"],
                )
              }
            >
              <option value="BANK_ONBOARDER">
                Onboarder / Relationship Manager
              </option>
              <option value="BANK_VERIFIER">Verifier / Credit Officer</option>
            </select>
          </label>
          <label>
            <span>Approval Limit</span>
            <Input
              placeholder="USD 250,000"
              value={form.approvalLimit}
              onChange={(event) =>
                updateField("approvalLimit", event.target.value)
              }
            />
          </label>
          <label>
            <span>Commodity Scope</span>
            <Input
              placeholder="Coffee, sesame"
              value={form.commodityScope}
              onChange={(event) =>
                updateField("commodityScope", event.target.value)
              }
            />
          </label>
          <label>
            <span>Effective From</span>
            <Input
              type="date"
              value={form.effectiveFrom}
              onChange={(event) =>
                updateField("effectiveFrom", event.target.value)
              }
            />
          </label>
        </section>

        <section className="role-form__section role-form__section--wide">
          <h3>Granular Permissions</h3>
          <div className="role-check-grid">
            <label>
              <input
                type="checkbox"
                checked={form.permissions.viewClients}
                onChange={(event) =>
                  updatePermission("viewClients", event.target.checked)
                }
              />
              View bank clients
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.permissions.createKycCase}
                onChange={(event) =>
                  updatePermission("createKycCase", event.target.checked)
                }
              />
              Create client KYC case
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.permissions.reviewLcRequests}
                onChange={(event) =>
                  updatePermission("reviewLcRequests", event.target.checked)
                }
              />
              Review LC requests
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.permissions.issueGuarantees}
                onChange={(event) =>
                  updatePermission("issueGuarantees", event.target.checked)
                }
              />
              Issue guarantees
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.permissions.verifyBlockchainRecords}
                onChange={(event) =>
                  updatePermission("verifyBlockchainRecords", event.target.checked)
                }
              />
              Verify on-chain contract records
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.permissions.configureRiskRules}
                onChange={(event) =>
                  updatePermission("configureRiskRules", event.target.checked)
                }
              />
              Configure risk rules
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.permissions.exportAuditReports}
                onChange={(event) =>
                  updatePermission("exportAuditReports", event.target.checked)
                }
              />
              Export audit reports
            </label>
          </div>
        </section>

        <section className="role-form__section role-form__section--wide">
          <h3>Current Bank Users</h3>
          <div className="role-panel__table role-panel__table--embedded">
            <div className="role-panel__table-head">
              <span>User</span>
              <span>Role</span>
              <span>Status</span>
              <span>Scope</span>
            </div>
            {users.map((user) => (
              <div className="role-panel__table-row" key={user.id}>
                <span>{user.fullName}</span>
                <span>{formatInternalUserRole(user.role)}</span>
                <span>{formatInternalUserStatus(user.status)}</span>
                <span>{user.commodityScope || user.approvalLimit || "—"}</span>
              </div>
            ))}
          </div>
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
            onClick={() => handleSave(false)}
          >
            Save User
          </Button>
          <Button type="submit" variant="legacy" size="legacy">
            Send Invite
          </Button>
        </div>
      </form>
    </div>
  );
}

function BankClientAccountsPage({
  bankId,
  onBack,
  onSaved,
}: {
  bankId: string;
  onBack: () => void;
  onSaved?: () => void;
}) {
  const [form, setForm] = useState<ClientAccountInput>(() =>
    emptyClientAccountInput(bankId),
  );
  const [clientId, setClientId] = useState<string | undefined>();
  const [clients, setClients] = useState(() => listClientAccounts(bankId));
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);
  const stats = getTenantStats(bankId);

  useEffect(() => {
    function refreshClients() {
      setClients(listClientAccounts(bankId));
    }
    refreshClients();
    window.addEventListener(TENANT_UPDATED_EVENT, refreshClients);
    return () =>
      window.removeEventListener(TENANT_UPDATED_EVENT, refreshClients);
  }, [bankId]);

  function updateField<K extends keyof ClientAccountInput>(
    key: K,
    value: ClientAccountInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateEdd(key: keyof ClientAccountInput["edd"], checked: boolean) {
    setForm((current) => ({
      ...current,
      edd: { ...current.edd, [key]: checked },
    }));
  }

  function handleAction(
    action: () => { client?: ClientAccountRecord; errors?: string[] },
    successMessage: string,
  ) {
    const result = action();
    if (result.errors?.length) {
      setFeedback({ kind: "error", message: result.errors.join(" ") });
      return;
    }
    if (result.client) {
      setClientId(result.client.id);
      setForm({
        ...emptyClientAccountInput(bankId),
        ...result.client,
      });
      setClients(listClientAccounts(bankId));
      setFeedback({ kind: "success", message: successMessage });
      onSaved?.();
    }
  }

  function loadClientForEdit(client: ClientAccountRecord) {
    setClientId(client.id);
    setForm({
      ...emptyClientAccountInput(bankId),
      ...client,
    });
    setFeedback({
      kind: "success",
      message: `Editing ${client.legalName}. Save changes or delete below.`,
    });
  }

  function resetForm() {
    setClientId(undefined);
    setForm(emptyClientAccountInput(bankId));
    setFeedback(null);
  }

  function handleDeleteClient(id: string, name: string) {
    if (!window.confirm(`Delete client ${name}?`)) return;
    const result = deleteClientAccount(id);
    if (result.errors?.length) {
      setFeedback({ kind: "error", message: result.errors.join(" ") });
      return;
    }
    if (clientId === id) resetForm();
    setClients(listClientAccounts(bankId));
    setFeedback({ kind: "success", message: `Deleted ${name}.` });
    onSaved?.();
  }

  return (
    <div className="role-panel role-page">
      <PageBackButton onBack={onBack} label="Back to Bank Admin" />
      <div className="role-page__header">
        <p className="role-panel__eyebrow">CLIENT MANAGEMENT</p>
        <h2>Client Trader Accounts</h2>
        <p>
          Create and manage buyer/seller trader accounts, KYC status, risk
          rating, commodity scope, and trading exposure limits.
        </p>
      </div>
      <form className="role-form">
        <section className="role-form__section">
          <h3>Trader Profile</h3>
          <label>
            <span>Legal Name</span>
            <Input
              placeholder="Nordic Imports B.V."
              value={form.legalName}
              onChange={(event) => updateField("legalName", event.target.value)}
            />
          </label>
          <label>
            <span>Trader Type</span>
            <select
              value={form.traderType}
              onChange={(event) =>
                updateField(
                  "traderType",
                  event.target.value as ClientAccountInput["traderType"],
                )
              }
            >
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="both">Buyer & Seller</option>
            </select>
          </label>
          <label>
            <span>Registration / Tax ID</span>
            <Input
              placeholder="Company registration number"
              value={form.registrationTaxId}
              onChange={(event) =>
                updateField("registrationTaxId", event.target.value)
              }
            />
          </label>
          <label>
            <span>Relationship Manager</span>
            <Input
              placeholder="Daniel Tadesse"
              value={form.relationshipManager}
              onChange={(event) =>
                updateField("relationshipManager", event.target.value)
              }
            />
          </label>
        </section>

        <section className="role-form__section">
          <h3>KYC & Risk</h3>
          <label>
            <span>Risk Rating</span>
            <select
              value={form.riskRating}
              onChange={(event) =>
                updateField(
                  "riskRating",
                  event.target.value as ClientAccountInput["riskRating"],
                )
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label>
            <span>EDD Notes</span>
            <Input
              placeholder="Beneficial ownership / PEP / sanctions notes"
              value={form.eddNotes}
              onChange={(event) => updateField("eddNotes", event.target.value)}
            />
          </label>
          <label>
            <span>Permitted Commodities</span>
            <Input
              placeholder="Coffee, sesame"
              value={form.permittedCommodities}
              onChange={(event) =>
                updateField("permittedCommodities", event.target.value)
              }
            />
          </label>
        </section>

        <section className="role-form__section role-form__section--wide">
          <h3>Enhanced Due Diligence Checklist</h3>
          <div className="role-check-grid">
            {(
              [
                ["beneficialOwnership", "Beneficial ownership verified"],
                ["sanctionsScreening", "Sanctions screening completed"],
                ["pepAdverseMedia", "PEP/adverse media reviewed"],
                ["sourceOfFunds", "Source of funds validated"],
                ["tradeHistory", "Trade history reviewed"],
                ["complianceSignOff", "Compliance officer sign-off"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={form.edd[key]}
                  onChange={(event) => updateEdd(key, event.target.checked)}
                />
                {label}
              </label>
            ))}
          </div>
        </section>

        <section className="role-form__section role-form__section--wide">
          <h3>Trading Limits</h3>
          <div className="role-form__inline-grid">
            <label>
              <span>Daily Limit</span>
              <Input
                placeholder="USD 1,000,000"
                value={form.dailyLimit}
                onChange={(event) =>
                  updateField("dailyLimit", event.target.value)
                }
              />
            </label>
            <label>
              <span>Per Trade Limit</span>
              <Input
                placeholder="USD 250,000"
                value={form.perTradeLimit}
                onChange={(event) =>
                  updateField("perTradeLimit", event.target.value)
                }
              />
            </label>
            <label>
              <span>Total Exposure Limit</span>
              <Input
                placeholder="USD 5,000,000"
                value={form.totalExposureLimit}
                onChange={(event) =>
                  updateField("totalExposureLimit", event.target.value)
                }
              />
            </label>
          </div>
        </section>

        <section className="role-form__section role-form__section--wide">
          <h3>All Clients Onboarded by This Bank</h3>
          <div className="role-client-summary">
            <div>
              <span>Total clients</span>
              <strong>{stats.clients}</strong>
            </div>
            <div>
              <span>Buyers</span>
              <strong>{stats.buyers}</strong>
            </div>
            <div>
              <span>Sellers</span>
              <strong>{stats.sellers}</strong>
            </div>
            <div>
              <span>High risk</span>
              <strong>{stats.highRisk}</strong>
            </div>
          </div>
          <div className="role-panel__table role-panel__table--embedded role-panel__table--clients">
            <div className="role-panel__table-head">
              <span>Client</span>
              <span>Type</span>
              <span>KYC</span>
              <span>Risk</span>
              <span>Limit</span>
              <span>RM</span>
              <span>Actions</span>
            </div>
            {clients.map((client) => (
              <div className="role-panel__table-row" key={client.id}>
                <span>{client.legalName}</span>
                <span>{formatTraderType(client.traderType)}</span>
                <span>{formatKycStatus(client.kycStatus)}</span>
                <span>{client.riskRating}</span>
                <span>{formatClientTradingLimit(client)}</span>
                <span>{client.relationshipManager || "—"}</span>
                <span className="role-table-actions">
                  <button
                    type="button"
                    onClick={() => loadClientForEdit(client)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteClient(client.id, client.legalName)
                    }
                  >
                    Delete
                  </button>
                </span>
              </div>
            ))}
          </div>
        </section>

        {feedback ? (
          <div
            className={`role-form__feedback role-form__feedback--${feedback.kind}`}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="role-form__actions">
          {clientId ? (
            <Button
              type="button"
              variant="legacy"
              size="legacy"
              onClick={resetForm}
            >
              Cancel Edit
            </Button>
          ) : null}
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            onClick={() =>
              handleAction(
                () =>
                  saveClientAccount({ ...form, kycStatus: "draft" }, clientId),
                clientId
                  ? `Changes saved for ${form.legalName || "client"}.`
                  : `Draft saved for ${form.legalName || "client"}.`,
              )
            }
          >
            {clientId ? "Save Changes" : "Save Client Draft"}
          </Button>
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            onClick={() =>
              handleAction(
                () => submitClientKyc(form, clientId),
                `${form.legalName || "Client"} submitted for KYC review.`,
              )
            }
          >
            Submit KYC for Review
          </Button>
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            onClick={() =>
              handleAction(
                () => activateClientAccount(form, clientId),
                `${form.legalName || "Client"} activated for trading.`,
              )
            }
          >
            Activate Trader
          </Button>
        </div>
      </form>
    </div>
  );
}

function BankRbacPage({
  bankId,
  onBack,
  onSaved,
}: {
  bankId: string;
  onBack: () => void;
  onSaved?: () => void;
}) {
  const [form, setForm] = useState<RbacPolicyInput>(() =>
    emptyRbacPolicyInput(bankId),
  );
  const [policyId, setPolicyId] = useState<string | undefined>();
  const [policies, setPolicies] = useState(() => listRbacPolicies(bankId));
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);

  useEffect(() => {
    function refreshPolicies() {
      setPolicies(listRbacPolicies(bankId));
    }
    refreshPolicies();
    window.addEventListener(TENANT_UPDATED_EVENT, refreshPolicies);
    return () =>
      window.removeEventListener(TENANT_UPDATED_EVENT, refreshPolicies);
  }, [bankId]);

  function updateField<K extends keyof RbacPolicyInput>(
    key: K,
    value: RbacPolicyInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updatePermission(
    key: keyof RbacPolicyInput["permissions"],
    checked: boolean,
  ) {
    setForm((current) => ({
      ...current,
      permissions: { ...current.permissions, [key]: checked },
    }));
  }

  function handleSave(publish: boolean) {
    const result = saveRbacPolicy(form, policyId, publish);
    if (result.errors?.length) {
      setFeedback({ kind: "error", message: result.errors.join(" ") });
      return;
    }
    if (result.policy) {
      setPolicyId(result.policy.id);
      setFeedback({
        kind: "success",
        message: publish
          ? `RBAC policy published for ${result.policy.role}.`
          : "Permission draft saved.",
      });
      onSaved?.();
    }
  }

  return (
    <div className="role-panel role-page">
      <PageBackButton onBack={onBack} label="Back to Bank Admin" />
      <div className="role-page__header">
        <p className="role-panel__eyebrow">RBAC</p>
        <h2>Granular Role-Based Access Control</h2>
        <p>
          Configure tenant permissions by role, product, approval limit, branch,
          commodity, and action sensitivity.
        </p>
      </div>
      <form
        className="role-form"
        onSubmit={(event) => {
          event.preventDefault();
          handleSave(true);
        }}
      >
        <section className="role-form__section">
          <h3>Role Template</h3>
          <label>
            <span>Role</span>
            <select
              value={form.role}
              onChange={(event) =>
                updateField(
                  "role",
                  event.target.value as RbacPolicyInput["role"],
                )
              }
            >
              <option value="BANK_ADMIN">Bank Admin</option>
              <option value="BANK_ONBOARDER">Onboarder</option>
              <option value="BANK_VERIFIER">Verifier / Credit Officer</option>
            </select>
          </label>
          <label>
            <span>Branch Scope</span>
            <Input
              placeholder="All branches or selected branch"
              value={form.branchScope}
              onChange={(event) =>
                updateField("branchScope", event.target.value)
              }
            />
          </label>
          <label>
            <span>Approval Threshold</span>
            <Input
              placeholder="USD 250,000"
              value={form.approvalThreshold}
              onChange={(event) =>
                updateField("approvalThreshold", event.target.value)
              }
            />
          </label>
        </section>

        <section className="role-form__section">
          <h3>Permission Groups</h3>
          <div className="role-check-grid role-check-grid--stack">
            {(
              [
                ["clientOnboardingKyc", "Client onboarding and KYC"],
                ["lcRequestReview", "LC request review"],
                ["guaranteeIssuance", "Guarantee issuance"],
                ["blockchainVerification", "On-chain contract verification"],
                ["riskRuleConfiguration", "Risk rule configuration"],
                ["settlementReleaseApproval", "Settlement release approval"],
                ["auditExport", "Audit export"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={form.permissions[key]}
                  onChange={(event) =>
                    updatePermission(key, event.target.checked)
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </section>

        <section className="role-form__section role-form__section--wide">
          <h3>Permission Matrix</h3>
          <div className="role-panel__table role-panel__table--embedded role-panel__table--rbac">
            <div className="role-panel__table-head">
              <span>Permission</span>
              <span>Admin</span>
              <span>Onboarder</span>
              <span>Verifier</span>
            </div>
            {rbacMatrixRows.map((row) => (
              <div className="role-panel__table-row" key={row[0]}>
                {row.map((cell) => (
                  <span key={cell}>{cell}</span>
                ))}
              </div>
            ))}
          </div>
          <div
            className="role-panel__table role-panel__table--embedded"
            style={{ marginTop: 12 }}
          >
            <div className="role-panel__table-head">
              <span>Role</span>
              <span>Branch</span>
              <span>Threshold</span>
              <span>Status</span>
            </div>
            {policies.map((policy) => (
              <div className="role-panel__table-row" key={policy.id}>
                <span>{policy.role}</span>
                <span>{policy.branchScope}</span>
                <span>{policy.approvalThreshold || "—"}</span>
                <span>
                  {policy.status === "published" ? "Published" : "Draft"}
                </span>
              </div>
            ))}
          </div>
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
            onClick={() => handleSave(false)}
          >
            Save Permission Draft
          </Button>
          <Button type="submit" variant="legacy" size="legacy">
            Publish RBAC Policy
          </Button>
        </div>
      </form>
    </div>
  );
}

function BankAdminPanel({ session }: { session: AuthSession }) {
  const [page, setPage] = useState<BankAdminPageKey>("home");
  const [anchorContractUid, setAnchorContractUid] = useState<string>();
  const bankId = resolveBankId(session.bankName);
  const [tenantTick, setTenantTick] = useState(0);

  const stats = useMemo(
    () => (bankId ? getTenantStats(bankId) : null),
    [bankId, tenantTick],
  );

  useEffect(() => {
    function handleNavigate(event: Event) {
      const nextPage = (event as CustomEvent<BankAdminPageKey>).detail;
      if (nextPage) setPage(nextPage);
    }

    function handleAnchorPage(event: Event) {
      const detail = (event as CustomEvent<{ contractUid?: string }>).detail;
      setAnchorContractUid(detail?.contractUid);
      setPage("contract-anchor");
    }

    window.addEventListener("ankuaru:bank-admin-page", handleNavigate);
    window.addEventListener(CONTRACT_ANCHOR_PAGE_EVENT, handleAnchorPage);

    return () => {
      window.removeEventListener("ankuaru:bank-admin-page", handleNavigate);
      window.removeEventListener(CONTRACT_ANCHOR_PAGE_EVENT, handleAnchorPage);
    };
  }, []);

  useEffect(() => {
    function refreshTenant() {
      setTenantTick((current) => current + 1);
    }

    window.addEventListener(TENANT_UPDATED_EVENT, refreshTenant);
    return () =>
      window.removeEventListener(TENANT_UPDATED_EVENT, refreshTenant);
  }, []);

  function refreshTenantData() {
    setTenantTick((current) => current + 1);
  }

  if (!bankId) {
    return (
      <div className="role-panel role-panel--super-admin">
        <BankTenantNotice bankName={session.bankName} />
      </div>
    );
  }

  if (page === "internal-users") {
    return (
      <BankInternalUsersPage
        bankId={bankId}
        onBack={() => setPage("home")}
        onSaved={refreshTenantData}
      />
    );
  }
  if (page === "client-accounts") {
    return (
      <BankClientAccountsPage
        bankId={bankId}
        onBack={() => setPage("home")}
        onSaved={refreshTenantData}
      />
    );
  }
  if (page === "rbac") {
    return (
      <BankRbacPage
        bankId={bankId}
        onBack={() => setPage("home")}
        onSaved={refreshTenantData}
      />
    );
  }
  if (page === "document-assets") {
    return (
      <BankDocumentAssetsPage
        bankId={bankId}
        onBack={() => setPage("home")}
      />
    );
  }
  if (page === "contract-anchor") {
    return (
      <ContractAnchorVerificationPage
        bankId={bankId}
        initialContractUid={anchorContractUid}
        onBack={() => {
          setAnchorContractUid(undefined);
          setPage("home");
        }}
        backLabel="Back to Bank Admin"
        scope={getBlockchainVerificationScope(session.role)}
      />
    );
  }
  if (page === "contracts") {
    return (
      <BankOperationsListPage
        bankId={bankId}
        kind="contracts"
        eyebrow="LCs & GUARANTEES"
        title="Letters of Credit & Contracts"
        onBack={() => setPage("home")}
      />
    );
  }
  if (page === "settlement") {
    return (
      <BankOperationsListPage
        bankId={bankId}
        kind="settlement"
        eyebrow="DVP SETTLEMENT"
        title="Settlement Oversight"
        onBack={() => setPage("home")}
      />
    );
  }
  if (page === "actors") {
    return (
      <BankOperationsListPage
        bankId={bankId}
        kind="actors"
        eyebrow="CLIENTS & KYC"
        title="Client KYC Registry"
        onBack={() => setPage("home")}
      />
    );
  }
  if (page === "risk") {
    return (
      <BankOperationsListPage
        bankId={bankId}
        kind="risk"
        eyebrow="RISK CONTROLS"
        title="Risk Alerts & Exposure"
        onBack={() => setPage("home")}
      />
    );
  }

  return (
    <div className="role-panel role-panel--super-admin">
      <div className="role-panel__header">
        <div>
          <p className="role-panel__eyebrow">BANK ADMIN · {session.bankName}</p>
          <h2>User, Client & RBAC Management</h2>
          <p>
            Create bank staff, manage trader accounts, assign limits, and
            control granular permissions across onboarding, verification, risk,
            settlement, and audit functions.
          </p>
        </div>
        <div className="role-panel__badge">
          <ShieldCheck aria-hidden="true" />
          Bank tenant admin
        </div>
      </div>

      <div className="role-panel__metrics">
        <div>
          <span>Internal Users</span>
          <strong>{stats?.internalUsers ?? 0}</strong>
        </div>
        <div>
          <span>Trader Clients</span>
          <strong>{stats?.clients ?? 0}</strong>
        </div>
        <div>
          <span>Pending KYC</span>
          <strong>{stats?.pendingKyc ?? 0}</strong>
        </div>
        <div>
          <span>RBAC Policies</span>
          <strong>{stats?.rbacPolicies ?? 0}</strong>
        </div>
      </div>

      <div className="role-panel__grid">
        <section className="role-action-card">
          <div className="role-action-card__icon">
            <UserCog aria-hidden="true" />
          </div>
          <div>
            <h3>Internal Users</h3>
            <p>
              Create and manage Onboarders and Verifiers, branch scopes,
              approval limits, and activation status.
            </p>
          </div>
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            onClick={() => setPage("internal-users")}
          >
            Manage Users
          </Button>
        </section>

        <section className="role-action-card">
          <div className="role-action-card__icon">
            <BriefcaseBusiness aria-hidden="true" />
          </div>
          <div>
            <h3>Client Trader Accounts</h3>
            <p>
              Onboard buyers and sellers, maintain KYC/EDD status, risk rating,
              commodity scope, and trading exposure limits.
            </p>
          </div>
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            onClick={() => setPage("client-accounts")}
          >
            Manage Clients
          </Button>
        </section>

        <section className="role-action-card">
          <div className="role-action-card__icon">
            <SlidersHorizontal aria-hidden="true" />
          </div>
          <div>
            <h3>RBAC Permissions</h3>
            <p>
              Configure granular access across KYC, LC review, guarantee
              issuance, risk controls, settlement release, and audit reports.
            </p>
          </div>
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            onClick={() => setPage("rbac")}
          >
            Configure RBAC
          </Button>
        </section>

        <section className="role-action-card">
          <div className="role-action-card__icon">
            <FileImage aria-hidden="true" />
          </div>
          <div>
            <h3>PDF Signature & Stamp</h3>
            <p>
              Upload the bank authorized signature image and verifier stamp used
              on generated Letters of Credit and trade contracts.
            </p>
          </div>
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            onClick={() => setPage("document-assets")}
          >
            Manage Document Assets
          </Button>
        </section>
      </div>
    </div>
  );
}

function OnboarderPanel({ session }: { session: AuthSession }) {
  const [page, setPage] = useState<OnboarderPageKey>("home");
  const [editingClientId, setEditingClientId] = useState<string>();
  const bankId = resolveBankId(session.bankName);

  useEffect(() => {
    function handleNavigate(event: Event) {
      const nextPage = (event as CustomEvent<OnboarderPageKey>).detail;
      if (nextPage) setPage(nextPage);
    }
    window.addEventListener("ankuaru:onboarder-page", handleNavigate);
    return () =>
      window.removeEventListener("ankuaru:onboarder-page", handleNavigate);
  }, []);

  if (!bankId) {
    return (
      <div className="role-panel role-panel--super-admin">
        <BankTenantNotice bankName={session.bankName} />
      </div>
    );
  }

  if (page === "register-client") {
    return (
      <RegisterAndOnboardClientPage
        bankId={bankId}
        initialClientId={editingClientId}
        onBack={() => {
          const returnPage = editingClientId ? "manage-clients" : "home";
          setEditingClientId(undefined);
          setPage(returnPage);
        }}
        backLabel="Back to Onboarder"
      />
    );
  }
  if (page === "manage-clients") {
    return (
      <ManageClientsPage
        bankId={bankId}
        onBack={() => setPage("home")}
        backLabel="Back to Onboarder"
        onEditClient={(client) => {
          setEditingClientId(client.id);
          setPage("register-client");
        }}
      />
    );
  }

  return (
    <div className="role-panel role-panel--super-admin">
      <div className="role-panel__header">
        <div>
          <p className="role-panel__eyebrow">ONBOARDER · {session.bankName}</p>
          <h2>Client Registration & Onboarding</h2>
          <p>
            Register new clients, collect KYC/EDD documents, and manage client
            onboarding cases.
          </p>
        </div>
        <div className="role-panel__badge">
          <UsersRound aria-hidden="true" /> Client desk
        </div>
      </div>
      <div className="role-panel__grid">
        <section className="role-action-card">
          <div className="role-action-card__icon">
            <UserPlus aria-hidden="true" />
          </div>
          <div>
            <h3>Register & Onboard Clients</h3>
            <p>
              Create buyer/seller profiles, collect documents, and submit cases
              for verification.
            </p>
          </div>
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            onClick={() => {
              setEditingClientId(undefined);
              setPage("register-client");
            }}
          >
            Start Onboarding
          </Button>
        </section>
        <section className="role-action-card">
          <div className="role-action-card__icon">
            <BriefcaseBusiness aria-hidden="true" />
          </div>
          <div>
            <h3>Check & Manage Clients</h3>
            <p>
              Review onboarding status, missing information, risk level, and
              assigned owner.
            </p>
          </div>
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            onClick={() => setPage("manage-clients")}
          >
            Manage Clients
          </Button>
        </section>
      </div>
    </div>
  );
}

function VerifierPanel({ session }: { session: AuthSession }) {
  const [page, setPage] = useState<VerifierPageKey>("home");
  const [anchorContractUid, setAnchorContractUid] = useState<string>();
  const [editingClientId, setEditingClientId] = useState<string>();
  const bankId = resolveBankId(session.bankName);

  useEffect(() => {
    function handleNavigate(event: Event) {
      const nextPage = (event as CustomEvent<VerifierPageKey>).detail;
      if (nextPage) setPage(nextPage);
    }

    function handleAnchorPage(event: Event) {
      const detail = (event as CustomEvent<{ contractUid?: string }>).detail;
      setAnchorContractUid(detail?.contractUid);
      setPage("contract-anchor");
    }

    window.addEventListener("ankuaru:verifier-page", handleNavigate);
    window.addEventListener(CONTRACT_ANCHOR_PAGE_EVENT, handleAnchorPage);
    return () => {
      window.removeEventListener("ankuaru:verifier-page", handleNavigate);
      window.removeEventListener(CONTRACT_ANCHOR_PAGE_EVENT, handleAnchorPage);
    };
  }, []);

  if (!bankId) {
    return (
      <div className="role-panel role-panel--super-admin">
        <BankTenantNotice bankName={session.bankName} />
      </div>
    );
  }

  if (page === "register-client") {
    return (
      <RegisterAndOnboardClientPage
        bankId={bankId}
        initialClientId={editingClientId}
        onBack={() => {
          const returnPage = editingClientId ? "manage-clients" : "home";
          setEditingClientId(undefined);
          setPage(returnPage);
        }}
        backLabel="Back to Verifier"
      />
    );
  }
  if (page === "manage-clients") {
    return (
      <ManageClientsPage
        bankId={bankId}
        onBack={() => setPage("home")}
        backLabel="Back to Verifier"
        onEditClient={(client) => {
          setEditingClientId(client.id);
          setPage("register-client");
        }}
      />
    );
  }
  if (page === "verification") {
    return <VerificationPage bankId={bankId} onBack={() => setPage("home")} />;
  }
  if (page === "issue-lc") {
    return (
      <IssueLetterOfCreditPage bankId={bankId} onBack={() => setPage("home")} />
    );
  }
  if (page === "generate-contract") {
    return (
      <GenerateContractPage bankId={bankId} onBack={() => setPage("home")} />
    );
  }
  if (page === "contract-anchor") {
    return (
      <ContractAnchorVerificationPage
        bankId={bankId}
        initialContractUid={anchorContractUid}
        onBack={() => {
          setAnchorContractUid(undefined);
          setPage("home");
        }}
        backLabel="Back to Verifier"
        scope={getBlockchainVerificationScope(session.role)}
      />
    );
  }

  return (
    <div className="role-panel role-panel--super-admin">
      <div className="role-panel__header">
        <div>
          <p className="role-panel__eyebrow">VERIFIER · {session.bankName}</p>
          <h2>Verification, LC & Contract Desk</h2>
          <p>
            Onboard clients, complete verification, issue letters of credit, and
            generate bank-backed contracts.
          </p>
        </div>
        <div className="role-panel__badge">
          <ShieldCheck aria-hidden="true" /> Credit officer
        </div>
      </div>
      <div className="role-panel__grid">
        {[
          [
            "register-client",
            "Register & Onboard Clients",
            "Create or complete client onboarding cases.",
            UserPlus,
          ],
          [
            "manage-clients",
            "Check & Manage Clients",
            "Review clients and pending information.",
            BriefcaseBusiness,
          ],
          [
            "verification",
            "Complete Verification",
            "Approve, reject, or request more information.",
            ShieldCheck,
          ],
          [
            "issue-lc",
            "Issue Letter of Credit",
            "Issue a digital LC against a trade or contract.",
            KeyRound,
          ],
          [
            "generate-contract",
            "Generate Contract",
            "Generate a bank-backed trade contract.",
            Building2,
          ],
          [
            "contract-anchor",
            "Verify On-Chain Record",
            "Inspect ledger attestation, tx hash, and document hash.",
            Link2,
          ],
        ].map(([id, title, desc, Icon]) => (
          <section className="role-action-card" key={String(id)}>
            <div className="role-action-card__icon">
              <Icon aria-hidden="true" />
            </div>
            <div>
              <h3>{String(title)}</h3>
              <p>{String(desc)}</p>
            </div>
            <Button
              type="button"
              variant="legacy"
              size="legacy"
              onClick={() => {
                if (id === "register-client") setEditingClientId(undefined);
                setPage(id as VerifierPageKey);
              }}
            >
              Open
            </Button>
          </section>
        ))}
      </div>
    </div>
  );
}

function ClientPanel({ session }: { session: AuthSession }) {
  const [page, setPage] = useState<ClientPageKey>("home");
  const [anchorContractUid, setAnchorContractUid] = useState<string>();
  const client =
    findClientByName(session.name) ?? findClientByName("Nordic Imports B.V.");
  const bankId =
    client?.bankId ??
    resolveBankId(session.bankName ?? "Abay Bank") ??
    "bank-abay";
  const tradeSummary = client
    ? getClientTradeSummary(client.legalName, bankId)
    : null;

  useEffect(() => {
    function handleNavigate(event: Event) {
      const nextPage = (event as CustomEvent<ClientPageKey>).detail;
      if (nextPage) setPage(nextPage);
    }

    function handleAnchorPage(event: Event) {
      if (!canOpenBlockchainVerification(session.role)) return;
      const detail = (event as CustomEvent<{ contractUid?: string }>).detail;
      setAnchorContractUid(detail?.contractUid);
      setPage("contract-anchor");
    }

    window.addEventListener("ankuaru:client-page", handleNavigate);
    window.addEventListener(CONTRACT_ANCHOR_PAGE_EVENT, handleAnchorPage);
    return () => {
      window.removeEventListener("ankuaru:client-page", handleNavigate);
      window.removeEventListener(CONTRACT_ANCHOR_PAGE_EVENT, handleAnchorPage);
    };
  }, [session.role]);

  if (page === "registration") {
    return (
      <ClientRegistrationPage
        session={session}
        onBack={() => setPage("home")}
      />
    );
  }
  if (page === "status") {
    return (
      <ClientStatusPage session={session} onBack={() => setPage("home")} />
    );
  }
  if (page === "contract-anchor" && client) {
    return (
      <ContractAnchorVerificationPage
        bankId={bankId}
        initialContractUid={anchorContractUid}
        onBack={() => {
          setAnchorContractUid(undefined);
          setPage("home");
        }}
        backLabel="Back to Client Portal"
        scope="own-contracts"
        clientLegalName={client.legalName}
        scopeLabel={blockchainVerificationScopeLabel(session.role)}
      />
    );
  }

  return (
    <div className="role-panel role-panel--super-admin">
      <div className="role-panel__header">
        <div>
          <p className="role-panel__eyebrow">CLIENT · {session.name}</p>
          <h2>Registration & Trade Overview</h2>
          <p>
            Register for ANKUARU trading access, track bank-led onboarding, and
            review your contracts, LCs, and settlements.
          </p>
        </div>
        <div className="role-panel__badge">
          <BriefcaseBusiness aria-hidden="true" /> Client portal
        </div>
      </div>

      {client && tradeSummary ? (
        <div
          className="role-client-summary"
          style={{ marginBottom: 16, marginTop: 16 }}
        >
          <div>
            <span>KYC Status</span>
            <strong>{formatKycStatus(client.kycStatus)}</strong>
          </div>
          <div>
            <span>Trading Limit</span>
            <strong>{formatClientTradingLimit(client)}</strong>
          </div>
          <div>
            <span>Contracts</span>
            <strong>{tradeSummary.contracts}</strong>
          </div>
          <div>
            <span>Pending Settlements</span>
            <strong>{tradeSummary.pendingSettlements}</strong>
          </div>
        </div>
      ) : null}

      <div className="role-panel__grid">
        <section className="role-action-card">
          <div className="role-action-card__icon">
            <UserPlus aria-hidden="true" />
          </div>
          <div>
            <h3>Registration & Onboarding</h3>
            <p>
              Submit your company, documents, bank relationship, and requested
              limits.
            </p>
          </div>
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            onClick={() => setPage("registration")}
          >
            Start Registration
          </Button>
        </section>
        <section className="role-action-card">
          <div className="role-action-card__icon">
            <SlidersHorizontal aria-hidden="true" />
          </div>
          <div>
            <h3>Account & Trades</h3>
            <p>
              View profile, limits, bank-backed contracts, letters of credit,
              and settlement status.
            </p>
          </div>
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            onClick={() => setPage("status")}
          >
            View Details
          </Button>
        </section>
        {canOpenBlockchainVerification(session.role) ? (
          <section className="role-action-card">
            <div className="role-action-card__icon">
              <Link2 aria-hidden="true" />
            </div>
            <div>
              <h3>Verify On-Chain Record</h3>
              <p>
                Inspect ledger attestation and document hash for your
                bank-backed contracts.
              </p>
            </div>
            <Button
              type="button"
              variant="legacy"
              size="legacy"
              onClick={() => setPage("contract-anchor")}
            >
              Open
            </Button>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function RegulatorPanel({ session }: { session: AuthSession }) {
  const [page, setPage] = useState<RegulatorPageKey>("home");
  const [anchorContractUid, setAnchorContractUid] = useState<string>();
  const bankId = resolveBankId(session.bankName ?? "Abay Bank") ?? "bank-abay";

  useEffect(() => {
    function handleNavigate(event: Event) {
      const nextPage = (event as CustomEvent<RegulatorPageKey>).detail;
      if (nextPage) setPage(nextPage);
    }

    function handleAnchorPage(event: Event) {
      if (!canOpenBlockchainVerification(session.role)) return;
      const detail = (event as CustomEvent<{ contractUid?: string }>).detail;
      setAnchorContractUid(detail?.contractUid);
      setPage("contract-anchor");
    }

    window.addEventListener("ankuaru:regulator-page", handleNavigate);
    window.addEventListener(CONTRACT_ANCHOR_PAGE_EVENT, handleAnchorPage);
    return () => {
      window.removeEventListener("ankuaru:regulator-page", handleNavigate);
      window.removeEventListener(CONTRACT_ANCHOR_PAGE_EVENT, handleAnchorPage);
    };
  }, [session.role]);

  if (page === "contracts") {
    return (
      <BankOperationsListPage
        bankId={bankId}
        kind="contracts"
        eyebrow="REGULATOR OVERSIGHT"
        title="Letters of Credit & Contracts"
        onBack={() => setPage("home")}
      />
    );
  }
  if (page === "settlement") {
    return (
      <BankOperationsListPage
        bankId={bankId}
        kind="settlement"
        eyebrow="DVP SETTLEMENT"
        title="Settlement Oversight"
        onBack={() => setPage("home")}
      />
    );
  }
  if (page === "contract-anchor") {
    return (
      <ContractAnchorVerificationPage
        bankId={bankId}
        initialContractUid={anchorContractUid}
        onBack={() => {
          setAnchorContractUid(undefined);
          setPage("home");
        }}
        backLabel="Back to Regulator"
        scope={getBlockchainVerificationScope(session.role)}
        scopeLabel={blockchainVerificationScopeLabel(session.role)}
      />
    );
  }

  return (
    <div className="role-panel role-panel--super-admin">
      <div className="role-panel__header">
        <div>
          <p className="role-panel__eyebrow">REGULATOR · READ ONLY</p>
          <h2>Market & Bank Oversight</h2>
          <p>
            Review bank-backed letters of credit, trade contracts, settlement
            activity, and on-chain attestations across the ANKUARU network.
          </p>
        </div>
        <div className="role-panel__badge">
          <ShieldCheck aria-hidden="true" /> Regulator viewer
        </div>
      </div>
      <div className="role-panel__grid">
        {[
          [
            "contracts",
            "LCs & Contracts",
            "Read-only registry of issued guarantees and trade contracts.",
            FileText,
          ],
          [
            "contract-anchor",
            "Verify On-Chain Record",
            "Inspect ledger attestation, tx hash, and document hash.",
            Link2,
          ],
          [
            "settlement",
            "DvP Settlement",
            "Monitor settlement status and release triggers.",
            Repeat2,
          ],
        ].map(([id, title, desc, Icon]) => (
          <section className="role-action-card" key={String(id)}>
            <div className="role-action-card__icon">
              <Icon aria-hidden="true" />
            </div>
            <div>
              <h3>{String(title)}</h3>
              <p>{String(desc)}</p>
            </div>
            <Button
              type="button"
              variant="legacy"
              size="legacy"
              onClick={() => setPage(id as RegulatorPageKey)}
            >
              Open
            </Button>
          </section>
        ))}
      </div>
    </div>
  );
}

function DefaultRolePanel({ session }: { session: AuthSession }) {
  return (
    <div className="role-panel role-panel--default">
      <p className="portfolio-welcome-text">
        {session.welcome} · {session.dashboardTitle}
      </p>
      <p>{session.dashboardSubtitle}</p>
      <Button
        type="button"
        variant="legacy"
        size="legacy"
        onClick={() => callLegacy((win) => win.showBsPortfolioPreview?.())}
      >
        Continue
      </Button>
    </div>
  );
}

export function RoleDashboardPanel({ session }: { session: AuthSession }) {
  if (session.role === "SUPER_ADMIN") {
    return <SuperAdminPanel />;
  }

  if (session.role === "BANK_ADMIN") {
    return <BankAdminPanel session={session} />;
  }

  if (session.role === "BANK_ONBOARDER") {
    return <OnboarderPanel session={session} />;
  }

  if (session.role === "BANK_VERIFIER") {
    return <VerifierPanel session={session} />;
  }

  if (session.role === "CLIENT") {
    return <ClientPanel session={session} />;
  }

  if (session.role === "REGULATOR") {
    return <RegulatorPanel session={session} />;
  }

  return <DefaultRolePanel session={session} />;
}
