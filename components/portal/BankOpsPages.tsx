"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { AuthSession } from "@/components/auth/auth-model";
import { Button } from "@/components/ui/button";
import { DocumentPdfActions } from "@/components/portal/DocumentPdfActions";
import { Input } from "@/components/ui/input";
import {
  BANKS_UPDATED_EVENT,
  formatBankStatus,
  getBank,
  listBanks,
  type BankRecord,
} from "@/lib/bank-db";
import {
  OPERATIONS_UPDATED_EVENT,
  assessLcIssuance,
  assessContractGeneration,
  buildContractDefaultsFromLc,
  buildContractDefaultsFromParties,
  buildLcCollateralReference,
  buildLcDefaultsFromApplicant,
  buildLcDefaultsFromContract,
  defaultLcExpiryDate,
  emptyLetterOfCreditInput,
  emptyTradeContractInput,
  contractPdfUrl,
  createContractPdf,
  createLcPdf,
  anchorTradeContractOnChain,
  formatBlockchainTx,
  formatLcType,
  generateTradeContract,
  getClientTradeSummary,
  issueLetterOfCredit,
  lcHasGeneratedContract,
  lcPdfUrl,
  listClientLettersOfCredit,
  listClientSettlements,
  listClientTradeContracts,
  listLettersOfCredit,
  listRiskAlerts,
  listSettlements,
  listTradeContracts,
  previewContractUid,
  previewLcUid,
  type LcType,
  type LetterOfCreditRecord,
  type TradeContractRecord,
} from "@/lib/bank-operations-db";
import { openContractAnchorPage } from "@/lib/contract-anchor-nav";
import {
  ClientAccountInput,
  ClientAccountRecord,
  TENANT_UPDATED_EVENT,
  VerificationChecklist,
  VerificationDecision,
  completeClientVerification,
  deleteClientAccount,
  emptyClientAccountInput,
  findClientByName,
  formatKycStatus,
  formatClientTradingLimit,
  formatInternalUserRole,
  formatInternalUserStatus,
  formatTraderType,
  getClientOnboardingStages,
  getClientOnboardingStats,
  listClientAccounts,
  listInternalUsers,
  resolveBankId,
  saveClientAccount,
  submitOnboardingClient,
} from "@/lib/bank-tenant-db";

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

function Feedback({
  feedback,
}: {
  feedback: { kind: "error" | "success"; message: string } | null;
}) {
  if (!feedback) return null;
  return (
    <div className={`role-form__feedback role-form__feedback--${feedback.kind}`}>
      {feedback.message}
    </div>
  );
}

export function SuperAdminBankDirectoryPage({ onBack }: { onBack: () => void }) {
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    function refresh() {
      setTick((current) => current + 1);
    }
    window.addEventListener(BANKS_UPDATED_EVENT, refresh);
    window.addEventListener(TENANT_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener(BANKS_UPDATED_EVENT, refresh);
      window.removeEventListener(TENANT_UPDATED_EVENT, refresh);
    };
  }, []);

  void tick;

  const selectedBank = selectedBankId ? getBank(selectedBankId) : undefined;

  useEffect(() => {
    if (selectedBankId && !getBank(selectedBankId)) {
      setSelectedBankId(null);
    }
  }, [selectedBankId, tick]);

  if (selectedBank) {
    return (
      <SuperAdminBankDetailPage
        bank={selectedBank}
        onBack={() => setSelectedBankId(null)}
      />
    );
  }

  const banks = listBanks();

  return (
    <div className="role-panel role-page">
      <PageBackButton onBack={onBack} label="Back to Super Admin" />
      <div className="role-page__header">
        <p className="role-panel__eyebrow">PLATFORM DIRECTORY</p>
        <h2>Registered Banks</h2>
        <p>Select a bank to view its internal users and client accounts.</p>
      </div>

      {banks.length === 0 ? (
        <div className="role-form__feedback role-form__feedback--error">
          No banks registered yet. Register a bank first.
        </div>
      ) : (
        <div className="role-panel__table role-panel__table--bank-list">
          <div className="role-panel__table-head">
            <span>Bank</span>
            <span>Status</span>
            <span>Admin User</span>
            <span>Staff</span>
            <span>Clients</span>
            <span>Action</span>
          </div>
          {banks.map((bank) => {
            const staffCount = listInternalUsers(bank.id).length;
            const clientCount = listClientAccounts(bank.id).length;

            return (
              <button
                type="button"
                className="role-panel__table-row role-bank-directory__row"
                key={bank.id}
                onClick={() => setSelectedBankId(bank.id)}
              >
                <span>
                  <strong>{bank.displayName}</strong>
                  <small>{bank.licenseNumber}</small>
                </span>
                <span>{formatBankStatus(bank.status)}</span>
                <span>{bank.adminUser}</span>
                <span>{staffCount}</span>
                <span>{clientCount}</span>
                <span className="role-bank-directory__open">View →</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SuperAdminBankDetailPage({
  bank,
  onBack,
}: {
  bank: BankRecord;
  onBack: () => void;
}) {
  const internalUsers = listInternalUsers(bank.id);
  const clients = listClientAccounts(bank.id);

  return (
    <div className="role-panel role-page">
      <PageBackButton onBack={onBack} label="Back to Bank Directory" />
      <div className="role-page__header">
        <p className="role-panel__eyebrow">BANK TENANT</p>
        <h2>{bank.displayName}</h2>
        <p>
          {bank.legalName} · {bank.headOfficeCity || "Head office not set"}
        </p>
      </div>

      <div className="role-client-summary role-bank-directory__summary">
        <div>
          <span>Status</span>
          <strong>{formatBankStatus(bank.status)}</strong>
        </div>
        <div>
          <span>Bank Admin</span>
          <strong>{bank.adminUser}</strong>
        </div>
        <div>
          <span>Internal Users</span>
          <strong>{internalUsers.length}</strong>
        </div>
        <div>
          <span>Clients</span>
          <strong>{clients.length}</strong>
        </div>
      </div>

      <section className="role-section-block">
        <h3>Internal Users</h3>
        <div className="role-panel__table role-panel__table--embedded role-panel__table--bank-staff">
          <div className="role-panel__table-head">
            <span>Name</span>
            <span>Role</span>
            <span>Branch / Desk</span>
            <span>Status</span>
            <span>Email</span>
          </div>
          {internalUsers.length === 0 ? (
            <div className="role-panel__table-row">
              <span>No internal users</span>
              <span>—</span>
              <span>—</span>
              <span>—</span>
              <span>—</span>
            </div>
          ) : (
            internalUsers.map((user) => (
              <div className="role-panel__table-row" key={user.id}>
                <span>{user.fullName}</span>
                <span>{formatInternalUserRole(user.role)}</span>
                <span>{user.branchDesk || "—"}</span>
                <span>{formatInternalUserStatus(user.status)}</span>
                <span>{user.workEmail}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="role-section-block">
        <h3>Client Accounts</h3>
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
          {clients.length === 0 ? (
            <div className="role-panel__table-row">
              <span>No clients onboarded</span>
              <span>—</span>
              <span>—</span>
              <span>—</span>
              <span>—</span>
              <span>—</span>
              <span>—</span>
            </div>
          ) : (
            clients.map((client) => (
              <div className="role-panel__table-row" key={client.id}>
                <span>{client.legalName}</span>
                <span>{formatTraderType(client.traderType)}</span>
                <span>{formatKycStatus(client.kycStatus)}</span>
                <span>{client.riskRating}</span>
                <span>{formatClientTradingLimit(client)}</span>
                <span>{client.relationshipManager || "—"}</span>
                <span>—</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export function RegisterAndOnboardClientPage({
  bankId,
  onBack,
  backLabel,
  onSaved,
  initialClientId,
}: {
  bankId: string;
  onBack: () => void;
  backLabel: string;
  onSaved?: () => void;
  initialClientId?: string;
}) {
  const [form, setForm] = useState<ClientAccountInput>(() =>
    emptyClientAccountInput(bankId),
  );
  const [clientId, setClientId] = useState<string>();
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!initialClientId) return;
    const client = listClientAccounts(bankId).find(
      (item) => item.id === initialClientId,
    );
    if (!client) return;
    setClientId(client.id);
    setForm({
      ...emptyClientAccountInput(bankId),
      ...client,
    });
  }, [bankId, initialClientId]);

  function updateField<K extends keyof ClientAccountInput>(
    key: K,
    value: ClientAccountInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateDoc(
    key: keyof ClientAccountInput["documentChecks"],
    checked: boolean,
  ) {
    setForm((current) => ({
      ...current,
      documentChecks: { ...current.documentChecks, [key]: checked },
    }));
  }

  function run(
    action: () => { client?: ClientAccountInput & { id: string }; errors?: string[] },
    message: string,
  ) {
    const result = action();
    if (result.errors?.length) {
      setFeedback({ kind: "error", message: result.errors.join(" ") });
      return;
    }
    if (result.client) {
      setClientId(result.client.id);
      setFeedback({ kind: "success", message });
      onSaved?.();
    }
  }

  return (
    <div className="role-panel role-page">
      <PageBackButton onBack={onBack} label={backLabel} />
      <div className="role-page__header">
        <p className="role-panel__eyebrow">CLIENT ONBOARDING</p>
        <h2>Register & Onboard Client</h2>
        <p>
          Capture buyer/seller profile, KYC documents, ownership details,
          commodity scope, and submit the case for verification.
        </p>
      </div>
      <form className="role-form">
        <section className="role-form__section">
          <h3>Client Profile</h3>
          <label>
            <span>Legal Name</span>
            <Input
              value={form.legalName}
              onChange={(event) => updateField("legalName", event.target.value)}
            />
          </label>
          <label>
            <span>Client Type</span>
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
            <span>Registration Number</span>
            <Input
              value={form.registrationTaxId}
              onChange={(event) =>
                updateField("registrationTaxId", event.target.value)
              }
            />
          </label>
          <label>
            <span>Tax ID</span>
            <Input
              value={form.registrationTaxId}
              onChange={(event) =>
                updateField("registrationTaxId", event.target.value)
              }
            />
          </label>
        </section>
        <section className="role-form__section">
          <h3>KYC / EDD</h3>
          <label>
            <span>Beneficial Owner</span>
            <Input
              value={form.beneficialOwner}
              onChange={(event) =>
                updateField("beneficialOwner", event.target.value)
              }
            />
          </label>
          <label>
            <span>Country / Jurisdiction</span>
            <Input
              value={form.jurisdiction}
              onChange={(event) => updateField("jurisdiction", event.target.value)}
            />
          </label>
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
            <span>Relationship Manager</span>
            <Input
              value={form.relationshipManager}
              onChange={(event) =>
                updateField("relationshipManager", event.target.value)
              }
            />
          </label>
        </section>
        <section className="role-form__section role-form__section--wide">
          <h3>Documents & Checks</h3>
          <div className="role-check-grid">
            {(
              [
                ["businessLicense", "Business license collected"],
                ["taxCertificate", "Tax certificate collected"],
                ["beneficialOwnershipDoc", "Beneficial ownership verified"],
                ["sanctionsScreening", "Sanctions screening completed"],
                ["pepAdverseMedia", "PEP/adverse media checked"],
                ["sourceOfFunds", "Source of funds reviewed"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={form.documentChecks[key]}
                  onChange={(event) => updateDoc(key, event.target.checked)}
                />
                {label}
              </label>
            ))}
          </div>
        </section>
        <section className="role-form__section role-form__section--wide">
          <h3>Requested Trading Limits</h3>
          <div className="role-form__inline-grid">
            <label>
              <span>Daily Limit</span>
              <Input
                value={form.dailyLimit}
                onChange={(event) => updateField("dailyLimit", event.target.value)}
              />
            </label>
            <label>
              <span>Per Trade Limit</span>
              <Input
                value={form.perTradeLimit}
                onChange={(event) =>
                  updateField("perTradeLimit", event.target.value)
                }
              />
            </label>
            <label>
              <span>Commodity Scope</span>
              <Input
                value={form.permittedCommodities}
                onChange={(event) =>
                  updateField("permittedCommodities", event.target.value)
                }
              />
            </label>
          </div>
        </section>
        <Feedback feedback={feedback} />
        <div className="role-form__actions">
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            onClick={() =>
              run(
                () => saveClientAccount(form, clientId),
                "Client draft saved locally.",
              )
            }
          >
            Save Draft
          </Button>
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            onClick={() =>
              run(
                () => submitOnboardingClient(form, clientId),
                "Client submitted for verification.",
              )
            }
          >
            Submit for Verification
          </Button>
        </div>
      </form>
    </div>
  );
}

export function ManageClientsPage({
  bankId,
  onBack,
  backLabel,
  onEditClient,
}: {
  bankId: string;
  onBack: () => void;
  backLabel: string;
  onEditClient?: (client: ClientAccountRecord) => void;
}) {
  const [clients, setClients] = useState(() => listClientAccounts(bankId));
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);
  const stats = getClientOnboardingStats(bankId);

  useEffect(() => {
    function refresh() {
      setClients(listClientAccounts(bankId));
    }
    refresh();
    window.addEventListener(TENANT_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(TENANT_UPDATED_EVENT, refresh);
  }, [bankId]);

  function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete client ${name}?`)) return;
    const result = deleteClientAccount(id);
    if (result.errors?.length) {
      setFeedback({ kind: "error", message: result.errors.join(" ") });
      return;
    }
    setClients(listClientAccounts(bankId));
    setFeedback({ kind: "success", message: `Deleted ${name}.` });
  }

  return (
    <div className="role-panel role-page">
      <PageBackButton onBack={onBack} label={backLabel} />
      <div className="role-page__header">
        <p className="role-panel__eyebrow">CLIENT PORTFOLIO</p>
        <h2>Check & Manage Clients</h2>
        <p>
          View client onboarding status, missing documents, KYC stage, risk
          rating, and assigned bank officer.
        </p>
      </div>
      <div className="role-client-summary">
        <div><span>Draft</span><strong>{stats.draft}</strong></div>
        <div><span>Pending verification</span><strong>{stats.pending}</strong></div>
        <div><span>More info</span><strong>{stats.moreInfo}</strong></div>
        <div><span>Approved</span><strong>{stats.approved}</strong></div>
      </div>
      <div className="role-panel__table role-panel__table--clients">
        <div className="role-panel__table-head">
          <span>Client</span><span>Type</span><span>KYC</span><span>Risk</span><span>Limit</span><span>Owner</span><span>Actions</span>
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
              {onEditClient ? (
                <button type="button" onClick={() => onEditClient(client)}>
                  Edit
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => handleDelete(client.id, client.legalName)}
              >
                Delete
              </button>
            </span>
          </div>
        ))}
      </div>
      <Feedback feedback={feedback} />
    </div>
  );
}

export function VerificationPage({
  bankId,
  onBack,
  onSaved,
}: {
  bankId: string;
  onBack: () => void;
  onSaved?: () => void;
}) {
  const clients = listClientAccounts(bankId).filter(
    (client) => client.kycStatus === "pending" || client.kycStatus === "draft",
  );
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const selected = clients.find((client) => client.id === clientId);
  const [decision, setDecision] = useState<VerificationDecision>("more-info");
  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState<VerificationChecklist>({
    kycDocumentsComplete: true,
    collateralReviewed: false,
    creditExposureApproved: false,
    complianceSignOffComplete: false,
  });
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);

  function submit(nextDecision: VerificationDecision) {
    if (!clientId) {
      setFeedback({ kind: "error", message: "Select a client case first." });
      return;
    }
    const result = completeClientVerification(
      clientId,
      nextDecision,
      notes,
      checklist,
    );
    if (result.errors?.length) {
      setFeedback({ kind: "error", message: result.errors.join(" ") });
      return;
    }
    setFeedback({
      kind: "success",
      message: `Verification updated for ${result.client?.legalName}.`,
    });
    onSaved?.();
  }

  return (
    <div className="role-panel role-page">
      <PageBackButton onBack={onBack} label="Back to Verifier" />
      <div className="role-page__header">
        <p className="role-panel__eyebrow">CREDIT VERIFICATION</p>
        <h2>Check & Complete Verification</h2>
      </div>
      <form className="role-form">
        <section className="role-form__section">
          <h3>Case Review</h3>
          <label>
            <span>Client</span>
            <select
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
            >
              {clients.length === 0 ? (
                <option value="">No pending cases</option>
              ) : (
                clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.legalName}
                  </option>
                ))
              )}
            </select>
          </label>
          <label>
            <span>Requested Limit</span>
            <Input
              readOnly
              value={selected ? formatClientTradingLimit(selected) : "—"}
            />
          </label>
          <label>
            <span>Decision</span>
            <select
              value={decision}
              onChange={(event) =>
                setDecision(event.target.value as VerificationDecision)
              }
            >
              <option value="approve">Approve</option>
              <option value="reject">Reject</option>
              <option value="more-info">Request more information</option>
            </select>
          </label>
        </section>
        <section className="role-form__section">
          <h3>Verification Checklist</h3>
          <div className="role-check-grid role-check-grid--stack">
            {(
              [
                ["kycDocumentsComplete", "KYC documents complete"],
                ["collateralReviewed", "Collateral reviewed"],
                ["creditExposureApproved", "Credit exposure approved"],
                ["complianceSignOffComplete", "Compliance sign-off complete"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={checklist[key]}
                  onChange={(event) =>
                    setChecklist((current) => ({
                      ...current,
                      [key]: event.target.checked,
                    }))
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </section>
        <section className="role-form__section role-form__section--wide">
          <h3>Reviewer Notes</h3>
          <label>
            <span>Notes</span>
            <Input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
        </section>
        <Feedback feedback={feedback} />
        <div className="role-form__actions">
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            onClick={() => submit("more-info")}
          >
            Request Info
          </Button>
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            onClick={() => submit(decision === "more-info" ? "approve" : decision)}
          >
            {decision === "approve" ? "Approve Verification" : "Apply Decision"}
          </Button>
        </div>
      </form>
    </div>
  );
}

const LC_TYPE_INFO: Record<
  LcType,
  { description: string; expiryDays: number; pdfTemplate: string }
> = {
  sight: {
    description: "Payment on presentation of compliant shipping documents.",
    expiryDays: 90,
    pdfTemplate: "NBE compliant LC template v1",
  },
  usance: {
    description: "Deferred payment 30–180 days after compliant presentation.",
    expiryDays: 180,
    pdfTemplate: "NBE usance LC template v1",
  },
  bond: {
    description: "Guarantee of contract performance obligations.",
    expiryDays: 365,
    pdfTemplate: "Performance bond template v1",
  },
  blocked: {
    description: "Reserve buyer funds until release conditions are met.",
    expiryDays: 120,
    pdfTemplate: "Blocked funds guarantee v1",
  },
};

export function IssueLetterOfCreditPage({
  bankId,
  onBack,
  onSaved,
}: {
  bankId: string;
  onBack: () => void;
  onSaved?: () => void;
}) {
  const bank = getBank(bankId);
  const [linkMode, setLinkMode] = useState<"contract" | "manual">("contract");
  const [selectedContractUid, setSelectedContractUid] = useState("");
  const [form, setForm] = useState(() => emptyLetterOfCreditInput(bankId));
  const [clients, setClients] = useState(() => listClientAccounts(bankId));
  const [contracts, setContracts] = useState(() => listTradeContracts(bankId));
  const [issuedLcs, setIssuedLcs] = useState(() => listLettersOfCredit(bankId));
  const [previewUid, setPreviewUid] = useState(() => previewLcUid(bankId));
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);

  useEffect(() => {
    function refresh() {
      setClients(listClientAccounts(bankId));
      setContracts(listTradeContracts(bankId));
      setIssuedLcs(listLettersOfCredit(bankId));
    }
    refresh();
    window.addEventListener(TENANT_UPDATED_EVENT, refresh);
    window.addEventListener(OPERATIONS_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener(TENANT_UPDATED_EVENT, refresh);
      window.removeEventListener(OPERATIONS_UPDATED_EVENT, refresh);
    };
  }, [bankId]);

  const activeBuyers = useMemo(
    () =>
      clients.filter(
        (client) =>
          client.kycStatus === "active" &&
          (client.traderType === "buyer" || client.traderType === "both"),
      ),
    [clients],
  );

  const activeSellers = useMemo(
    () =>
      clients.filter(
        (client) =>
          client.kycStatus === "active" &&
          (client.traderType === "seller" || client.traderType === "both"),
      ),
    [clients],
  );

  const linkableContracts = useMemo(
    () =>
      contracts.filter(
        (contract) =>
          contract.status === "generated" &&
          !issuedLcs.some(
            (lc) =>
              lc.contractUid === contract.contractUid && lc.status === "issued",
          ),
      ),
    [contracts, issuedLcs],
  );

  const selectedContract = useMemo(
    () =>
      selectedContractUid
        ? contracts.find((contract) => contract.contractUid === selectedContractUid)
        : undefined,
    [contracts, selectedContractUid],
  );

  const assessment = useMemo(() => assessLcIssuance(form), [form]);
  const applicantClient = assessment.applicantClient;
  const beneficiaryClient = useMemo(
    () => findClientByName(form.beneficiary, bankId),
    [form.beneficiary, bankId],
  );
  const expiryPreset90 = defaultLcExpiryDate(90);
  const expiryPreset180 = defaultLcExpiryDate(180);

  function updateField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function applyContract(contract: TradeContractRecord) {
    setForm((current) => ({
      ...current,
      ...buildLcDefaultsFromContract(bankId, contract),
    }));
    setPreviewUid(previewLcUid(bankId));
  }

  function handleContractSelect(contractUid: string) {
    setSelectedContractUid(contractUid);
    if (!contractUid) {
      setForm(emptyLetterOfCreditInput(bankId));
      setPreviewUid(previewLcUid(bankId));
      return;
    }
    const contract = contracts.find((item) => item.contractUid === contractUid);
    if (contract) applyContract(contract);
  }

  function handleApplicantSelect(applicant: string) {
    setForm((current) => ({
      ...current,
      ...buildLcDefaultsFromApplicant(bankId, applicant, current.beneficiary),
    }));
    setPreviewUid(previewLcUid(bankId));
  }

  function handleBeneficiarySelect(beneficiary: string) {
    updateField("beneficiary", beneficiary);
  }

  function handleLcTypeChange(lcType: LcType) {
    const info = LC_TYPE_INFO[lcType];
    setForm((current) => ({
      ...current,
      lcType,
      expiryDate: defaultLcExpiryDate(info.expiryDays),
      pdfTemplate: info.pdfTemplate,
    }));
  }

  function resetFormData() {
    setLinkMode("contract");
    setSelectedContractUid("");
    setForm(emptyLetterOfCreditInput(bankId));
    setPreviewUid(previewLcUid(bankId));
  }

  function resetForm() {
    resetFormData();
    setFeedback(null);
  }

  return (
    <div className="role-panel role-page">
      <PageBackButton onBack={onBack} label="Back to Verifier" />
      <div className="role-page__header">
        <p className="role-panel__eyebrow">LETTER OF CREDIT</p>
        <h2>Issue Letter of Credit</h2>
        <p>
          Link to an ANKUARU trade contract or compose manually. Client limits,
          KYC status, and exposure checks update as you select parties.
        </p>
      </div>
      <form
        className="role-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setSubmitting(true);
          setFeedback(null);

          try {
            const result = issueLetterOfCredit(form);
            if (result.errors?.length) {
              setFeedback({ kind: "error", message: result.errors.join(" ") });
              return;
            }
            if (!result.lc) return;

            const pdf = await createLcPdf(result.lc.lcUid, result.lc);
            window.open(pdf.pdfUrl, "_blank", "noopener,noreferrer");

            setFeedback({
              kind: "success",
              message: `LC ${result.lc.lcUid} issued. PDF saved and opened for download.`,
            });
            resetFormData();
            onSaved?.();
          } catch (error) {
            setFeedback({
              kind: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "LC saved but PDF generation failed.",
            });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <section className="role-form__section role-form__section--wide">
          <h3>Trade Reference</h3>
          <div className="role-check-grid role-check-grid--stack">
            <label>
              <input
                type="radio"
                name="lc-link-mode"
                checked={linkMode === "contract"}
                onChange={() => {
                  setLinkMode("contract");
                  setSelectedContractUid("");
                  setForm(emptyLetterOfCreditInput(bankId));
                  setPreviewUid(previewLcUid(bankId));
                }}
              />
              Link to ANKUARU contract
            </label>
            <label>
              <input
                type="radio"
                name="lc-link-mode"
                checked={linkMode === "manual"}
                onChange={() => {
                  setLinkMode("manual");
                  setSelectedContractUid("");
                  setForm(emptyLetterOfCreditInput(bankId));
                  setPreviewUid(previewLcUid(bankId));
                }}
              />
              Manual LC (no contract link)
            </label>
          </div>
          {linkMode === "contract" ? (
            <label>
              <span>Trade Contract</span>
              <select
                value={selectedContractUid}
                onChange={(event) => handleContractSelect(event.target.value)}
              >
                <option value="">Select contract…</option>
                {linkableContracts.map((contract) => (
                  <option key={contract.id} value={contract.contractUid}>
                    {contract.contractUid} · {contract.buyer} → {contract.seller}{" "}
                    · {contract.commodity}
                  </option>
                ))}
              </select>
              {linkableContracts.length === 0 ? (
                <p className="role-form__hint">
                  No generated contracts without an issued LC. Generate a contract
                  first or switch to manual entry.
                </p>
              ) : null}
            </label>
          ) : (
            <label>
              <span>Contract UID (optional)</span>
              <Input
                placeholder="CTR-2026-00091"
                value={form.contractUid}
                onChange={(event) => updateField("contractUid", event.target.value)}
              />
            </label>
          )}
          {selectedContract ? (
            <div className="role-detail-grid">
              <div>
                <span>Commodity</span>
                <strong>{selectedContract.commodity}</strong>
              </div>
              <div>
                <span>Quantity</span>
                <strong>{selectedContract.quantity}</strong>
              </div>
              <div>
                <span>Contract type</span>
                <strong>{selectedContract.contractType}</strong>
              </div>
              <div>
                <span>Settlement trigger</span>
                <strong>{selectedContract.settlementTrigger}</strong>
              </div>
            </div>
          ) : null}
        </section>

        <section className="role-form__section">
          <h3>Parties</h3>
          <label>
            <span>Applicant / Buyer</span>
            <select
              value={form.applicant}
              disabled={linkMode === "contract" && Boolean(selectedContractUid)}
              onChange={(event) => handleApplicantSelect(event.target.value)}
            >
              <option value="">Select buyer…</option>
              {activeBuyers.map((client) => (
                <option key={client.id} value={client.legalName}>
                  {client.legalName} · {formatTraderType(client.traderType)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Beneficiary / Seller</span>
            <select
              value={form.beneficiary}
              disabled={linkMode === "contract" && Boolean(selectedContractUid)}
              onChange={(event) => handleBeneficiarySelect(event.target.value)}
            >
              <option value="">Select seller…</option>
              {activeSellers.map((client) => (
                <option key={client.id} value={client.legalName}>
                  {client.legalName} · {formatTraderType(client.traderType)}
                </option>
              ))}
            </select>
          </label>
          {applicantClient ? (
            <div className="role-detail-grid">
              <div>
                <span>KYC</span>
                <strong>{formatKycStatus(applicantClient.kycStatus)}</strong>
              </div>
              <div>
                <span>Risk</span>
                <strong>{applicantClient.riskRating}</strong>
              </div>
              <div>
                <span>Per-trade limit</span>
                <strong>{formatClientTradingLimit(applicantClient)}</strong>
              </div>
              <div>
                <span>RM</span>
                <strong>{applicantClient.relationshipManager || "—"}</strong>
              </div>
            </div>
          ) : null}
        </section>

        <section className="role-form__section">
          <h3>LC Terms</h3>
          <label>
            <span>LC Type</span>
            <select
              value={form.lcType}
              onChange={(event) =>
                handleLcTypeChange(event.target.value as LcType)
              }
            >
              <option value="sight">Sight LC</option>
              <option value="usance">Usance LC</option>
              <option value="bond">Performance Bond</option>
              <option value="blocked">Blocked Funds</option>
            </select>
            <p className="role-form__hint">{LC_TYPE_INFO[form.lcType].description}</p>
          </label>
          <label>
            <span>Amount</span>
            <Input
              placeholder={
                applicantClient?.perTradeLimit || "USD 250,000"
              }
              value={form.amount}
              onChange={(event) => updateField("amount", event.target.value)}
            />
            {applicantClient?.perTradeLimit ? (
              <p className="role-form__hint">
                Suggested from buyer per-trade limit:{" "}
                {applicantClient.perTradeLimit}
              </p>
            ) : null}
          </label>
          <label>
            <span>Expiry Date</span>
            <div className="role-form__field-row">
              <Input
                type="date"
                value={form.expiryDate}
                onChange={(event) =>
                  updateField("expiryDate", event.target.value)
                }
              />
              <div
                className="role-form__chip-group"
                role="group"
                aria-label="Quick expiry presets"
              >
                <button
                  type="button"
                  className={`role-form__chip${
                    form.expiryDate === expiryPreset90 ? " is-active" : ""
                  }`}
                  onClick={() => updateField("expiryDate", expiryPreset90)}
                >
                  +90 days
                </button>
                <button
                  type="button"
                  className={`role-form__chip${
                    form.expiryDate === expiryPreset180 ? " is-active" : ""
                  }`}
                  onClick={() => updateField("expiryDate", expiryPreset180)}
                >
                  +180 days
                </button>
              </div>
            </div>
          </label>
        </section>

        <section className="role-form__section">
          <h3>Collateral & Template</h3>
          <label>
            <span>Collateral Reference</span>
            <div className="role-form__field-row">
              <Input
                value={form.collateralReference}
                onChange={(event) =>
                  updateField("collateralReference", event.target.value)
                }
              />
              <button
                type="button"
                className="role-form__chip role-form__chip--action"
                onClick={() =>
                  updateField(
                    "collateralReference",
                    buildLcCollateralReference(bankId),
                  )
                }
              >
                Regenerate
              </button>
            </div>
          </label>
          <label>
            <span>PDF Template</span>
            <select
              value={form.pdfTemplate}
              onChange={(event) => updateField("pdfTemplate", event.target.value)}
            >
              <option value="NBE compliant LC template v1">
                NBE compliant LC template v1
              </option>
              <option value="NBE usance LC template v1">
                NBE usance LC template v1
              </option>
              <option value="Performance bond template v1">
                Performance bond template v1
              </option>
              <option value="Blocked funds guarantee v1">
                Blocked funds guarantee v1
              </option>
            </select>
          </label>
        </section>

        <section className="role-form__section role-form__section--wide">
          <h3>Issuance Preview</h3>
          <div className="role-detail-grid">
            <div>
              <span>Bank</span>
              <strong>{bank?.displayName ?? "Unknown bank"}</strong>
            </div>
            <div>
              <span>Preview LC UID</span>
              <strong>{previewUid}</strong>
            </div>
            <div>
              <span>LC type</span>
              <strong>{formatLcType(form.lcType)}</strong>
            </div>
            <div>
              <span>Beneficiary KYC</span>
              <strong>
                {beneficiaryClient
                  ? formatKycStatus(beneficiaryClient.kycStatus)
                  : "—"}
              </strong>
            </div>
          </div>
          {assessment.warnings.length > 0 ? (
            <div className="role-form__hint role-form__hint--warning">
              {assessment.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}
        </section>

        <Feedback feedback={feedback} />
        <div className="role-form__actions">
          <Button type="button" variant="legacy" size="legacy" onClick={resetForm}>
            Reset Form
          </Button>
          <Button type="submit" variant="legacy" size="legacy" disabled={submitting}>
            {submitting ? "Issuing & generating PDF..." : "Issue Digital LC"}
          </Button>
        </div>

        <section className="role-form__section role-form__section--wide">
          <h3>Recently Issued LCs</h3>
          <div className="role-panel__table role-panel__table--embedded role-panel__table--lc-registry">
            <div className="role-panel__table-head">
              <span>LC UID</span>
              <span>Applicant</span>
              <span>Beneficiary</span>
              <span>Type</span>
              <span>Amount</span>
              <span>Contract</span>
              <span>PDF</span>
            </div>
            {issuedLcs.length === 0 ? (
              <div className="role-panel__table-row">
                <span>No LCs issued yet</span>
                <span>—</span>
                <span>—</span>
                <span>—</span>
                <span>—</span>
                <span>—</span>
                <span>—</span>
              </div>
            ) : (
              issuedLcs.map((lc) => (
                <div className="role-panel__table-row" key={lc.id}>
                  <span>{lc.lcUid}</span>
                  <span>{lc.applicant}</span>
                  <span>{lc.beneficiary}</span>
                  <span>{formatLcType(lc.lcType)}</span>
                  <span>{lc.amount}</span>
                  <span>{lc.contractUid || "—"}</span>
                  <span>
                    <DocumentPdfActions
                      pdfUrl={lcPdfUrl(lc.lcUid)}
                      title={`Letter of Credit · ${lc.lcUid}`}
                    />
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </form>
    </div>
  );
}

const CONTRACT_TYPE_PRESETS = [
  "Coffee export sale · FOB Djibouti",
  "Coffee export sale · CIF Djibouti",
  "Sesame bulk sale · FOB Djibouti",
  "Pulses export · FOB Djibouti",
] as const;

const SETTLEMENT_TRIGGER_PRESETS = [
  "Warehouse + BL confirmation",
  "LC presentation + document check",
  "Delivery at port + quality certificate",
  "DvP release on custody event",
] as const;

export function GenerateContractPage({
  bankId,
  onBack,
  onSaved,
}: {
  bankId: string;
  onBack: () => void;
  onSaved?: () => void;
}) {
  const bank = getBank(bankId);
  const [linkMode, setLinkMode] = useState<"lc" | "manual">("lc");
  const [selectedLcUid, setSelectedLcUid] = useState("");
  const [form, setForm] = useState(() => emptyTradeContractInput(bankId));
  const [clients, setClients] = useState(() => listClientAccounts(bankId));
  const [issuedLcs, setIssuedLcs] = useState(() => listLettersOfCredit(bankId));
  const [contracts, setContracts] = useState(() => listTradeContracts(bankId));
  const [previewUid, setPreviewUid] = useState(() => previewContractUid());
  const [submitting, setSubmitting] = useState(false);
  const [lastAnchoredUid, setLastAnchoredUid] = useState<string>();
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);

  useEffect(() => {
    function refresh() {
      setClients(listClientAccounts(bankId));
      setIssuedLcs(listLettersOfCredit(bankId));
      setContracts(listTradeContracts(bankId));
    }
    refresh();
    window.addEventListener(TENANT_UPDATED_EVENT, refresh);
    window.addEventListener(OPERATIONS_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener(TENANT_UPDATED_EVENT, refresh);
      window.removeEventListener(OPERATIONS_UPDATED_EVENT, refresh);
    };
  }, [bankId]);

  const activeBuyers = useMemo(
    () =>
      clients.filter(
        (client) =>
          client.kycStatus === "active" &&
          (client.traderType === "buyer" || client.traderType === "both"),
      ),
    [clients],
  );

  const activeSellers = useMemo(
    () =>
      clients.filter(
        (client) =>
          client.kycStatus === "active" &&
          (client.traderType === "seller" || client.traderType === "both"),
      ),
    [clients],
  );

  const linkableLcs = useMemo(
    () =>
      issuedLcs.filter(
        (lc) =>
          lc.status === "issued" && !lcHasGeneratedContract(bankId, lc.lcUid),
      ),
    [issuedLcs, bankId],
  );

  const selectedLc = useMemo(
    () =>
      selectedLcUid
        ? issuedLcs.find((lc) => lc.lcUid === selectedLcUid)
        : undefined,
    [issuedLcs, selectedLcUid],
  );

  const assessment = useMemo(() => assessContractGeneration(form), [form]);

  function updateField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function applyLc(lc: LetterOfCreditRecord) {
    setForm((current) => ({
      ...current,
      ...buildContractDefaultsFromLc(bankId, lc),
    }));
    setPreviewUid(previewContractUid());
  }

  function handleLcSelect(lcUid: string) {
    setSelectedLcUid(lcUid);
    if (!lcUid) {
      setForm(emptyTradeContractInput(bankId));
      setPreviewUid(previewContractUid());
      return;
    }
    const lc = issuedLcs.find((item) => item.lcUid === lcUid);
    if (lc) applyLc(lc);
  }

  function handleBuyerSelect(buyer: string) {
    setForm((current) => ({
      ...current,
      ...buildContractDefaultsFromParties(bankId, buyer, current.seller),
    }));
    setPreviewUid(previewContractUid());
  }

  function resetFormData() {
    setLinkMode("lc");
    setSelectedLcUid("");
    setForm(emptyTradeContractInput(bankId));
    setPreviewUid(previewContractUid());
  }

  function resetForm() {
    resetFormData();
    setFeedback(null);
    setLastAnchoredUid(undefined);
  }

  return (
    <div className="role-panel role-page">
      <PageBackButton onBack={onBack} label="Back to Verifier" />
      <div className="role-page__header">
        <p className="role-panel__eyebrow">CONTRACTING</p>
        <h2>Generate Bank-Backed Contract</h2>
        <p>
          Link to an issued letter of credit or compose manually. Parties, trade
          terms, and validation update as you select clients and guarantees.
        </p>
      </div>
      <form
        className="role-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setSubmitting(true);
          setFeedback(null);

          try {
            const result = generateTradeContract(form);
            if (result.errors?.length) {
              setFeedback({ kind: "error", message: result.errors.join(" ") });
              return;
            }
            if (!result.contract) return;

            const pdf = await createContractPdf(
              result.contract.contractUid,
              result.contract,
            );
            const anchor = await anchorTradeContractOnChain(result.contract.contractUid);
            window.open(pdf.pdfUrl, "_blank", "noopener,noreferrer");

            setFeedback({
              kind: "success",
              message: anchor.alreadyAnchored
                ? `Contract ${result.contract.contractUid} generated. PDF saved. Already anchored on-chain (${formatBlockchainTx(anchor.blockchain.txHash)}).`
                : `Contract ${result.contract.contractUid} generated, PDF saved, and submitted to the ANKUARU smart contract. Tx ${formatBlockchainTx(anchor.blockchain.txHash)} · block ${anchor.blockchain.blockNumber.toLocaleString()}.`,
            });
            setLastAnchoredUid(result.contract.contractUid);
            resetFormData();
            onSaved?.();
          } catch (error) {
            setFeedback({
              kind: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Contract saved but PDF generation failed.",
            });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <section className="role-form__section role-form__section--wide">
          <h3>Bank Guarantee Link</h3>
          <div className="role-check-grid role-check-grid--stack">
            <label>
              <input
                type="radio"
                name="contract-link-mode"
                checked={linkMode === "lc"}
                onChange={() => {
                  setLinkMode("lc");
                  setSelectedLcUid("");
                  setForm(emptyTradeContractInput(bankId));
                  setPreviewUid(previewContractUid());
                }}
              />
              Link to issued letter of credit
            </label>
            <label>
              <input
                type="radio"
                name="contract-link-mode"
                checked={linkMode === "manual"}
                onChange={() => {
                  setLinkMode("manual");
                  setSelectedLcUid("");
                  setForm(emptyTradeContractInput(bankId));
                  setPreviewUid(previewContractUid());
                }}
              />
              Manual contract (parties first)
            </label>
          </div>
          {linkMode === "lc" ? (
            <label>
              <span>Letter of Credit</span>
              <select
                value={selectedLcUid}
                onChange={(event) => handleLcSelect(event.target.value)}
              >
                <option value="">Select LC…</option>
                {linkableLcs.map((lc) => (
                  <option key={lc.id} value={lc.lcUid}>
                    {lc.lcUid} · {lc.applicant} → {lc.beneficiary} · {lc.amount}
                  </option>
                ))}
              </select>
              {linkableLcs.length === 0 ? (
                <p className="role-form__hint">
                  No issued LCs without a generated contract. Issue an LC first
                  or switch to manual entry.
                </p>
              ) : null}
            </label>
          ) : (
            <label>
              <span>Guarantee / LC UID (optional)</span>
              <Input
                placeholder="LC-ABAY-2026-0091"
                value={form.guaranteeLcUid}
                onChange={(event) =>
                  updateField("guaranteeLcUid", event.target.value)
                }
              />
            </label>
          )}
          {selectedLc ? (
            <div className="role-detail-grid">
              <div>
                <span>LC type</span>
                <strong>{formatLcType(selectedLc.lcType)}</strong>
              </div>
              <div>
                <span>LC amount</span>
                <strong>{selectedLc.amount}</strong>
              </div>
              <div>
                <span>Expiry</span>
                <strong>{selectedLc.expiryDate || "—"}</strong>
              </div>
              <div>
                <span>Contract ref</span>
                <strong>{selectedLc.contractUid || "—"}</strong>
              </div>
            </div>
          ) : null}
        </section>

        <section className="role-form__section">
          <h3>Parties</h3>
          <label>
            <span>Buyer</span>
            <select
              value={form.buyer}
              disabled={linkMode === "lc" && Boolean(selectedLcUid)}
              onChange={(event) => handleBuyerSelect(event.target.value)}
            >
              <option value="">Select buyer…</option>
              {activeBuyers.map((client) => (
                <option key={client.id} value={client.legalName}>
                  {client.legalName} · {formatTraderType(client.traderType)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Seller</span>
            <select
              value={form.seller}
              disabled={linkMode === "lc" && Boolean(selectedLcUid)}
              onChange={(event) => updateField("seller", event.target.value)}
            >
              <option value="">Select seller…</option>
              {activeSellers.map((client) => (
                <option key={client.id} value={client.legalName}>
                  {client.legalName} · {formatTraderType(client.traderType)}
                </option>
              ))}
            </select>
          </label>
          {(assessment.buyerClient || assessment.sellerClient) && (
            <div className="role-detail-grid">
              {assessment.buyerClient ? (
                <>
                  <div>
                    <span>Buyer KYC</span>
                    <strong>
                      {formatKycStatus(assessment.buyerClient.kycStatus)}
                    </strong>
                  </div>
                  <div>
                    <span>Buyer limit</span>
                    <strong>
                      {formatClientTradingLimit(assessment.buyerClient)}
                    </strong>
                  </div>
                </>
              ) : null}
              {assessment.sellerClient ? (
                <>
                  <div>
                    <span>Seller KYC</span>
                    <strong>
                      {formatKycStatus(assessment.sellerClient.kycStatus)}
                    </strong>
                  </div>
                  <div>
                    <span>Seller commodities</span>
                    <strong>
                      {assessment.sellerClient.permittedCommodities || "—"}
                    </strong>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </section>

        <section className="role-form__section">
          <h3>Contract Structure</h3>
          <label>
            <span>Contract Type</span>
            <select
              value={
                CONTRACT_TYPE_PRESETS.includes(
                  form.contractType as (typeof CONTRACT_TYPE_PRESETS)[number],
                )
                  ? form.contractType
                  : form.contractType
                    ? "__custom__"
                    : ""
              }
              onChange={(event) => {
                const value = event.target.value;
                if (value === "__custom__") return;
                updateField("contractType", value);
              }}
            >
              <option value="">Select template…</option>
              {CONTRACT_TYPE_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
              <option value="__custom__">Custom…</option>
            </select>
            <Input
              placeholder="Or enter custom contract type"
              value={form.contractType}
              onChange={(event) =>
                updateField("contractType", event.target.value)
              }
            />
          </label>
          {linkMode === "manual" ? (
            <label>
              <span>Guarantee / LC UID</span>
              <select
                value={form.guaranteeLcUid}
                onChange={(event) =>
                  updateField("guaranteeLcUid", event.target.value)
                }
              >
                <option value="">No LC linked</option>
                {issuedLcs.map((lc) => (
                  <option key={lc.id} value={lc.lcUid}>
                    {lc.lcUid} · {lc.applicant} → {lc.beneficiary}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </section>

        <section className="role-form__section">
          <h3>Trade Terms</h3>
          <label>
            <span>Commodity</span>
            <Input
              placeholder="Ethiopian coffee · Jimma G5"
              value={form.commodity}
              onChange={(event) => updateField("commodity", event.target.value)}
            />
            {assessment.buyerClient?.permittedCommodities ? (
              <p className="role-form__hint">
                Buyer scope: {assessment.buyerClient.permittedCommodities}
              </p>
            ) : null}
          </label>
          <label>
            <span>Quantity</span>
            <Input
              placeholder="17.8t"
              value={form.quantity}
              onChange={(event) => updateField("quantity", event.target.value)}
            />
          </label>
          <label>
            <span>Price</span>
            <Input
              placeholder={
                assessment.linkedLc?.amount
                  ? `Up to ${assessment.linkedLc.amount}`
                  : "USD/kg differential"
              }
              value={form.price}
              onChange={(event) => updateField("price", event.target.value)}
            />
          </label>
          <label>
            <span>Settlement Trigger</span>
            <div className="role-form__chip-group" role="group" aria-label="Settlement triggers">
              {SETTLEMENT_TRIGGER_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`role-form__chip${
                    form.settlementTrigger === preset ? " is-active" : ""
                  }`}
                  onClick={() => updateField("settlementTrigger", preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
            <Input
              placeholder="Custom settlement trigger"
              value={form.settlementTrigger}
              onChange={(event) =>
                updateField("settlementTrigger", event.target.value)
              }
            />
          </label>
        </section>

        <section className="role-form__section role-form__section--wide">
          <h3>Generation Preview</h3>
          <div className="role-detail-grid">
            <div>
              <span>Bank</span>
              <strong>{bank?.displayName ?? "Unknown bank"}</strong>
            </div>
            <div>
              <span>Preview contract UID</span>
              <strong>{previewUid}</strong>
            </div>
            <div>
              <span>Linked LC</span>
              <strong>{form.guaranteeLcUid || "None"}</strong>
            </div>
            <div>
              <span>LC status</span>
              <strong>{assessment.linkedLc?.status ?? "—"}</strong>
            </div>
          </div>
          {assessment.warnings.length > 0 ? (
            <div className="role-form__hint role-form__hint--warning">
              {assessment.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}
        </section>

        <Feedback feedback={feedback} />
        {lastAnchoredUid && feedback?.kind === "success" ? (
          <div className="role-form__actions role-form__actions--compact">
            <Button
              type="button"
              variant="legacy"
              size="legacy"
              onClick={() => openContractAnchorPage(lastAnchoredUid)}
            >
              View on-chain record
            </Button>
          </div>
        ) : null}
        <div className="role-form__actions">
          <Button type="button" variant="legacy" size="legacy" onClick={resetForm}>
            Reset Form
          </Button>
          <Button
            type="submit"
            variant="legacy"
            size="legacy"
            disabled={submitting}
          >
            {submitting ? "Generating & anchoring..." : "Generate & Anchor Contract"}
          </Button>
        </div>

        <section className="role-form__section role-form__section--wide">
          <h3>Generated Contracts</h3>
          <div className="role-panel__table role-panel__table--embedded role-panel__table--contract-registry">
            <div className="role-panel__table-head">
              <span>Contract UID</span>
              <span>Buyer</span>
              <span>Seller</span>
              <span>Commodity</span>
              <span>LC Link</span>
              <span>Status</span>
              <span>Chain</span>
              <span>PDF</span>
            </div>
            {contracts.length === 0 ? (
              <div className="role-panel__table-row">
                <span>No contracts yet</span>
                <span>—</span>
                <span>—</span>
                <span>—</span>
                <span>—</span>
                <span>—</span>
                <span>—</span>
                <span>—</span>
              </div>
            ) : (
              contracts.map((contract) => (
                <div className="role-panel__table-row" key={contract.id}>
                  <span>
                    <button
                      type="button"
                      className="role-inline-link"
                      onClick={() => openContractAnchorPage(contract.contractUid)}
                    >
                      {contract.contractUid}
                    </button>
                  </span>
                  <span>{contract.buyer}</span>
                  <span>{contract.seller}</span>
                  <span>{contract.commodity}</span>
                  <span>{contract.guaranteeLcUid || "—"}</span>
                  <span>{contract.status}</span>
                  <span
                    className="role-chain-cell"
                    title={
                      contract.blockchain
                        ? `${contract.blockchain.network} · ${contract.blockchain.txHash}`
                        : "Not anchored"
                    }
                  >
                    {contract.blockchain ? (
                      <>
                        <strong>Anchored</strong>
                        <small>{formatBlockchainTx(contract.blockchain.txHash)}</small>
                        <button
                          type="button"
                          className="role-inline-link"
                          onClick={() => openContractAnchorPage(contract.contractUid)}
                        >
                          Verify
                        </button>
                      </>
                    ) : (
                      "Pending"
                    )}
                  </span>
                  <span>
                    <DocumentPdfActions
                      pdfUrl={contractPdfUrl(contract.contractUid)}
                      title={`Trade Contract · ${contract.contractUid}`}
                    />
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </form>
    </div>
  );
}

export function ClientRegistrationPage({
  session,
  onBack,
  onSaved,
}: {
  session: AuthSession;
  onBack: () => void;
  onSaved?: () => void;
}) {
  const bankId = resolveBankId(session.bankName ?? "Abay Bank") ?? "bank-abay";
  const [form, setForm] = useState<ClientAccountInput>(() => ({
    ...emptyClientAccountInput(bankId),
    legalName: session.name,
    preferredBank: session.bankName ?? "Abay Bank",
  }));
  const [clientId, setClientId] = useState<string>();
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);

  return (
    <div className="role-panel role-page">
      <PageBackButton onBack={onBack} label="Back to Client" />
      <div className="role-page__header">
        <p className="role-panel__eyebrow">CLIENT SELF-SERVICE</p>
        <h2>Registration & Onboarding</h2>
      </div>
      <form className="role-form">
        <section className="role-form__section">
          <h3>Company Profile</h3>
          <label>
            <span>Legal Name</span>
            <Input
              value={form.legalName}
              onChange={(event) =>
                setForm((current) => ({ ...current, legalName: event.target.value }))
              }
            />
          </label>
          <label>
            <span>Email</span>
            <Input
              type="email"
              value={form.contactEmail}
              onChange={(event) =>
                setForm((current) => ({ ...current, contactEmail: event.target.value }))
              }
            />
          </label>
          <label>
            <span>Role</span>
            <select
              value={form.traderType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  traderType: event.target.value as ClientAccountInput["traderType"],
                }))
              }
            >
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="both">Buyer & Seller</option>
            </select>
          </label>
          <label>
            <span>Preferred Bank</span>
            <Input
              value={form.preferredBank}
              onChange={(event) =>
                setForm((current) => ({ ...current, preferredBank: event.target.value }))
              }
            />
          </label>
        </section>
        <Feedback feedback={feedback} />
        <div className="role-form__actions">
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            onClick={() => {
              const result = saveClientAccount(form, clientId);
              if (result.errors?.length) {
                setFeedback({ kind: "error", message: result.errors.join(" ") });
                return;
              }
              if (result.client) {
                setClientId(result.client.id);
                setFeedback({ kind: "success", message: "Registration draft saved." });
                onSaved?.();
              }
            }}
          >
            Save Draft
          </Button>
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            onClick={() => {
              const result = submitOnboardingClient(form, clientId);
              if (result.errors?.length) {
                setFeedback({ kind: "error", message: result.errors.join(" ") });
                return;
              }
              setFeedback({
                kind: "success",
                message: "Onboarding submitted to your bank.",
              });
              onSaved?.();
            }}
          >
            Submit Onboarding
          </Button>
        </div>
      </form>
    </div>
  );
}

export function ClientStatusPage({
  session,
  onBack,
}: {
  session: AuthSession;
  onBack: () => void;
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    function refresh() {
      setTick((current) => current + 1);
    }
    window.addEventListener(TENANT_UPDATED_EVENT, refresh);
    window.addEventListener(OPERATIONS_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener(TENANT_UPDATED_EVENT, refresh);
      window.removeEventListener(OPERATIONS_UPDATED_EVENT, refresh);
    };
  }, []);

  void tick;

  const client =
    findClientByName(session.name) ??
    findClientByName("Nordic Imports B.V.");
  const bankId = client?.bankId ?? resolveBankId(session.bankName ?? "Abay Bank") ?? "bank-abay";
  const stages = client ? getClientOnboardingStages(client) : [];
  const tradeSummary = client
    ? getClientTradeSummary(client.legalName, bankId)
    : { contracts: 0, lcs: 0, pendingSettlements: 0, activeContracts: 0 };
  const lettersOfCredit = client
    ? listClientLettersOfCredit(client.legalName, bankId)
    : [];
  const contracts = client
    ? listClientTradeContracts(client.legalName, bankId)
    : [];
  const settlements = client
    ? listClientSettlements(client.legalName, bankId)
    : [];

  function clientRoleInContract(
    contract: { buyer: string; seller: string },
  ) {
    if (!client) return "—";
    if (contract.buyer.trim().toLowerCase() === client.legalName.trim().toLowerCase()) {
      return "Buyer";
    }
    if (contract.seller.trim().toLowerCase() === client.legalName.trim().toLowerCase()) {
      return "Seller";
    }
    return "Party";
  }

  function clientRoleInLc(lc: { applicant: string; beneficiary: string }) {
    if (!client) return "—";
    if (lc.applicant.trim().toLowerCase() === client.legalName.trim().toLowerCase()) {
      return "Applicant";
    }
    if (lc.beneficiary.trim().toLowerCase() === client.legalName.trim().toLowerCase()) {
      return "Beneficiary";
    }
    return "Party";
  }

  return (
    <div className="role-panel role-page">
      <PageBackButton onBack={onBack} label="Back to Client" />
      <div className="role-page__header">
        <p className="role-panel__eyebrow">ACCOUNT OVERVIEW</p>
        <h2>{client ? client.legalName : "No registration found yet"}</h2>
        <p>
          View your KYC profile, trading limits, bank-backed contracts, letters
          of credit, and settlement status.
        </p>
      </div>

      {client ? (
        <>
          <div className="role-client-summary">
            <div>
              <span>KYC Status</span>
              <strong>{formatKycStatus(client.kycStatus)}</strong>
            </div>
            <div>
              <span>Risk Rating</span>
              <strong>{client.riskRating}</strong>
            </div>
            <div>
              <span>Trading Limit</span>
              <strong>{formatClientTradingLimit(client)}</strong>
            </div>
            <div>
              <span>Active Contracts</span>
              <strong>{tradeSummary.activeContracts}</strong>
            </div>
          </div>

          <section className="role-section-block">
            <h3>Account Profile</h3>
            <div className="role-detail-grid">
              <div>
                <span>Trader Type</span>
                <strong>{formatTraderType(client.traderType)}</strong>
              </div>
              <div>
                <span>Preferred Bank</span>
                <strong>{client.preferredBank || "Abay Bank"}</strong>
              </div>
              <div>
                <span>Relationship Manager</span>
                <strong>{client.relationshipManager || "—"}</strong>
              </div>
              <div>
                <span>Registration / Tax ID</span>
                <strong>{client.registrationTaxId || "—"}</strong>
              </div>
              <div>
                <span>Jurisdiction</span>
                <strong>{client.jurisdiction || "—"}</strong>
              </div>
              <div>
                <span>Commodity Scope</span>
                <strong>{client.permittedCommodities || "—"}</strong>
              </div>
              <div>
                <span>Beneficial Owner</span>
                <strong>{client.beneficialOwner || "—"}</strong>
              </div>
              <div>
                <span>Verification Decision</span>
                <strong>
                  {client.verificationDecision
                    ? client.verificationDecision
                    : client.kycStatus === "active"
                      ? "Approved"
                      : "Pending review"}
                </strong>
              </div>
            </div>
          </section>

          <section className="role-section-block">
            <h3>Trading Limits</h3>
            <div className="role-detail-grid">
              <div>
                <span>Daily Limit</span>
                <strong>{client.dailyLimit || "—"}</strong>
              </div>
              <div>
                <span>Per Trade Limit</span>
                <strong>{client.perTradeLimit || "—"}</strong>
              </div>
              <div>
                <span>Total Exposure Limit</span>
                <strong>{client.totalExposureLimit || "—"}</strong>
              </div>
              <div>
                <span>Bank Contact</span>
                <strong>{client.contactEmail || session.email}</strong>
              </div>
            </div>
          </section>

          <section className="role-section-block">
            <h3>Onboarding Progress</h3>
            <div className="role-panel__table">
              <div className="role-panel__table-head">
                <span>Stage</span><span>Status</span><span>Owner</span><span>Next Step</span>
              </div>
              {stages.map((row) => (
                <div className="role-panel__table-row" key={row.stage}>
                  <span>{row.stage}</span>
                  <span>{row.status}</span>
                  <span>{row.owner}</span>
                  <span>{row.nextStep}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="role-section-block">
            <h3>Letters of Credit ({tradeSummary.lcs})</h3>
            <div className="role-panel__table role-panel__table--client-lc">
              <div className="role-panel__table-head">
                <span>LC UID</span>
                <span>Counterparty</span>
                <span>Your Role</span>
                <span>Amount</span>
                <span>Status</span>
                <span>PDF</span>
              </div>
              {lettersOfCredit.length === 0 ? (
                <div className="role-panel__table-row">
                  <span>—</span>
                  <span>No LC issued yet</span>
                  <span>—</span>
                  <span>—</span>
                  <span>—</span>
                  <span>—</span>
                </div>
              ) : (
                lettersOfCredit.map((lc) => (
                  <div className="role-panel__table-row" key={lc.id}>
                    <span>{lc.lcUid}</span>
                    <span>
                      {clientRoleInLc(lc) === "Applicant"
                        ? lc.beneficiary
                        : lc.applicant}
                    </span>
                    <span>{clientRoleInLc(lc)}</span>
                    <span>{lc.amount}</span>
                    <span>{lc.status}</span>
                    <span>
                      <DocumentPdfActions
                        pdfUrl={lcPdfUrl(lc.lcUid)}
                        title={`Letter of Credit · ${lc.lcUid}`}
                      />
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="role-section-block">
            <h3>Bank-Backed Contracts ({tradeSummary.contracts})</h3>
            <div className="role-panel__table role-panel__table--client-contracts">
              <div className="role-panel__table-head">
                <span>Contract UID</span>
                <span>Counterparty</span>
                <span>Your Role</span>
                <span>Commodity</span>
                <span>LC Link</span>
                <span>Status</span>
                <span>Chain</span>
                <span>PDF</span>
              </div>
              {contracts.length === 0 ? (
                <div className="role-panel__table-row">
                  <span>—</span>
                  <span>No contracts yet</span>
                  <span>—</span>
                  <span>—</span>
                  <span>—</span>
                  <span>—</span>
                  <span>—</span>
                  <span>—</span>
                </div>
              ) : (
                contracts.map((contract) => (
                  <div className="role-panel__table-row" key={contract.id}>
                    <span>
                      <button
                        type="button"
                        className="role-inline-link"
                        onClick={() => openContractAnchorPage(contract.contractUid)}
                      >
                        {contract.contractUid}
                      </button>
                    </span>
                    <span>
                      {clientRoleInContract(contract) === "Buyer"
                        ? contract.seller
                        : contract.buyer}
                    </span>
                    <span>{clientRoleInContract(contract)}</span>
                    <span>{contract.commodity}</span>
                    <span>{contract.guaranteeLcUid || "—"}</span>
                    <span>{contract.status}</span>
                    <span
                      className="role-chain-cell"
                      title={
                        contract.blockchain
                          ? `${contract.blockchain.network} · ${contract.blockchain.txHash}`
                          : "Not anchored"
                      }
                    >
                      {contract.blockchain ? (
                        <>
                          <strong>Anchored</strong>
                          <small>{formatBlockchainTx(contract.blockchain.txHash)}</small>
                          <button
                            type="button"
                            className="role-inline-link"
                            onClick={() => openContractAnchorPage(contract.contractUid)}
                          >
                            Verify
                          </button>
                        </>
                      ) : (
                        "Pending"
                      )}
                    </span>
                    <span>
                      <DocumentPdfActions
                        pdfUrl={contractPdfUrl(contract.contractUid)}
                        title={`Trade Contract · ${contract.contractUid}`}
                      />
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="role-section-block">
            <h3>Settlements ({tradeSummary.pendingSettlements} pending)</h3>
            <div className="role-panel__table role-panel__table--client-settlement">
              <div className="role-panel__table-head">
                <span>Contract</span>
                <span>Counterparty</span>
                <span>Amount</span>
                <span>Status</span>
                <span>Trigger</span>
              </div>
              {settlements.length === 0 ? (
                <div className="role-panel__table-row">
                  <span>—</span>
                  <span>No settlements yet</span>
                  <span>—</span>
                  <span>—</span>
                  <span>—</span>
                </div>
              ) : (
                settlements.map((settlement) => (
                  <div className="role-panel__table-row" key={settlement.id}>
                    <span>{settlement.contractUid}</span>
                    <span>
                      {settlement.buyer.trim().toLowerCase() ===
                      client.legalName.trim().toLowerCase()
                        ? settlement.seller
                        : settlement.buyer}
                    </span>
                    <span>{settlement.amount}</span>
                    <span>{settlement.status}</span>
                    <span>{settlement.trigger}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      ) : (
        <div className="role-panel__table">
          <div className="role-panel__table-row">
            <span>Registration</span>
            <span>Not started</span>
            <span>Client</span>
            <span>Submit onboarding form</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function BankOperationsListPage({
  bankId,
  title,
  eyebrow,
  onBack,
  kind,
}: {
  bankId: string;
  title: string;
  eyebrow: string;
  onBack: () => void;
  kind: "contracts" | "settlement" | "actors" | "risk";
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    function refresh() {
      setTick((current) => current + 1);
    }
    window.addEventListener(OPERATIONS_UPDATED_EVENT, refresh);
    window.addEventListener(TENANT_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener(OPERATIONS_UPDATED_EVENT, refresh);
      window.removeEventListener(TENANT_UPDATED_EVENT, refresh);
    };
  }, []);

  void tick;

  if (kind === "contracts") {
    const lcs = listLettersOfCredit(bankId);
    const contracts = listTradeContracts(bankId);
    return (
      <div className="role-panel role-page">
        <PageBackButton onBack={onBack} label="Back to Bank Admin" />
        <div className="role-page__header">
          <p className="role-panel__eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <div className="role-panel__table role-panel__table--embedded">
          <div className="role-panel__table-head">
            <span>LC UID</span><span>Applicant</span><span>Amount</span><span>Status</span><span>PDF</span>
          </div>
          {lcs.map((lc) => (
            <div className="role-panel__table-row" key={lc.id}>
              <span>{lc.lcUid}</span>
              <span>{lc.applicant}</span>
              <span>{lc.amount}</span>
              <span>{lc.status}</span>
              <span>
                <DocumentPdfActions
                  pdfUrl={lcPdfUrl(lc.lcUid)}
                  title={`Letter of Credit · ${lc.lcUid}`}
                />
              </span>
            </div>
          ))}
        </div>
        <div className="role-panel__table role-panel__table--embedded" style={{ marginTop: 12 }}>
          <div className="role-panel__table-head">
            <span>Contract</span><span>Buyer</span><span>Seller</span><span>Status</span><span>Chain</span><span>PDF</span>
          </div>
          {contracts.map((contract) => (
            <div className="role-panel__table-row" key={contract.id}>
              <span>
                <button
                  type="button"
                  className="role-inline-link"
                  onClick={() => openContractAnchorPage(contract.contractUid)}
                >
                  {contract.contractUid}
                </button>
              </span>
              <span>{contract.buyer}</span>
              <span>{contract.seller}</span>
              <span>{contract.status}</span>
              <span
                className="role-chain-cell"
                title={
                  contract.blockchain
                    ? `${contract.blockchain.network} · ${contract.blockchain.txHash}`
                    : "Not anchored"
                }
              >
                {contract.blockchain ? (
                  <>
                    <strong>Anchored</strong>
                    <small>{formatBlockchainTx(contract.blockchain.txHash)}</small>
                    <button
                      type="button"
                      className="role-inline-link"
                      onClick={() => openContractAnchorPage(contract.contractUid)}
                    >
                      Verify
                    </button>
                  </>
                ) : (
                  "Pending"
                )}
              </span>
              <span>
                <DocumentPdfActions
                  pdfUrl={contractPdfUrl(contract.contractUid)}
                  title={`Trade Contract · ${contract.contractUid}`}
                />
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === "settlement") {
    const settlements = listSettlements(bankId);
    return (
      <div className="role-panel role-page">
        <PageBackButton onBack={onBack} label="Back to Bank Admin" />
        <div className="role-page__header">
          <p className="role-panel__eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <div className="role-panel__table">
          <div className="role-panel__table-head">
            <span>Contract</span><span>Buyer</span><span>Amount</span><span>Status</span><span>Trigger</span>
          </div>
          {settlements.map((item) => (
            <div className="role-panel__table-row" key={item.id}>
              <span>{item.contractUid}</span>
              <span>{item.buyer}</span>
              <span>{item.amount}</span>
              <span>{item.status}</span>
              <span>{item.trigger}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === "risk") {
    const alerts = listRiskAlerts(bankId);
    return (
      <div className="role-panel role-page">
        <PageBackButton onBack={onBack} label="Back to Bank Admin" />
        <div className="role-page__header">
          <p className="role-panel__eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <div className="role-panel__table">
          <div className="role-panel__table-head">
            <span>Client</span><span>Commodity</span><span>Exposure</span><span>Severity</span><span>Status</span>
          </div>
          {alerts.map((alert) => (
            <div className="role-panel__table-row" key={alert.id}>
              <span>{alert.clientName}</span>
              <span>{alert.commodity}</span>
              <span>{alert.exposure}</span>
              <span>{alert.severity}</span>
              <span>{alert.status}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <ManageClientsPage
      bankId={bankId}
      onBack={onBack}
      backLabel="Back to Bank Admin"
    />
  );
}
