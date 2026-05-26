"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  BriefcaseBusiness,
  KeyRound,
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

type SuperAdminPage = "home" | "bank-registration" | "bank-admin" | "credentials";
type BankAdminPageKey = "home" | "internal-users" | "client-accounts" | "rbac";
type OnboarderPageKey = "home" | "register-client" | "manage-clients";
type VerifierPageKey =
  | "home"
  | "register-client"
  | "manage-clients"
  | "verification"
  | "issue-lc"
  | "generate-contract";
type ClientPageKey = "home" | "registration" | "status";

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

function BankRegistrationPage({ onBack }: { onBack: () => void }) {
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
      <form className="role-form">
        <section className="role-form__section">
          <h3>Legal Details</h3>
          <label>
            <span>Legal Bank Name</span>
            <Input placeholder="e.g. Abay Bank S.C." />
          </label>
          <label>
            <span>License Number</span>
            <Input placeholder="NBE-BNK-0000" />
          </label>
          <label>
            <span>Tax Identification Number</span>
            <Input placeholder="TIN / VAT number" />
          </label>
          <label>
            <span>Head Office City</span>
            <Input placeholder="Addis Ababa" />
          </label>
          <label>
            <span>Regulator Status</span>
            <select defaultValue="licensed">
              <option value="licensed">Licensed by NBE</option>
              <option value="pending">Pending verification</option>
              <option value="restricted">Restricted / conditional</option>
            </select>
          </label>
          <label>
            <span>Data Residency Region</span>
            <Input placeholder="Ethiopia / Addis Ababa DC" />
          </label>
        </section>

        <section className="role-form__section">
          <h3>Bank Profile</h3>
          <label>
            <span>Display Name</span>
            <Input placeholder="Abay Bank" />
          </label>
          <label>
            <span>Logo URL</span>
            <Input placeholder="https://bank.et/logo.svg" />
          </label>
          <label>
            <span>Supported Commodities</span>
            <Input placeholder="Coffee, sesame, pulses" />
          </label>
          <label>
            <span>Supported Currencies</span>
            <Input placeholder="ETB, USD, EUR" />
          </label>
          <label>
            <span>Primary Contact Email</span>
            <Input type="email" placeholder="tradefinance@bank.et" />
          </label>
          <label>
            <span>Branches Enabled</span>
            <Input placeholder="Main, Bole, Modjo" />
          </label>
          <label>
            <span>Trade Finance Contact</span>
            <Input placeholder="+251 11 ..." />
          </label>
        </section>

        <section className="role-form__section role-form__section--wide">
          <h3>Required Documents</h3>
          <div className="role-check-grid">
            <label><input type="checkbox" /> Banking license uploaded</label>
            <label><input type="checkbox" /> Incorporation document uploaded</label>
            <label><input type="checkbox" /> Board resolution uploaded</label>
            <label><input type="checkbox" /> API security questionnaire uploaded</label>
            <label><input type="checkbox" /> Authorized signatory list uploaded</label>
            <label><input type="checkbox" /> AML/CFT policy uploaded</label>
          </div>
        </section>

        <section className="role-form__section role-form__section--wide">
          <h3>Core Banking API Credentials</h3>
          <div className="role-form__inline-grid">
            <label>
              <span>Environment</span>
              <select defaultValue="sandbox">
                <option value="sandbox">Sandbox first</option>
                <option value="production">Production approval required</option>
              </select>
            </label>
            <label>
              <span>Client ID Prefix</span>
              <Input placeholder="abay-corebanking" />
            </label>
            <label>
              <span>Credential Scopes</span>
              <Input placeholder="lc:issue, guarantee:read, settlement:release" />
            </label>
          </div>
          <p className="role-form__note">
            Credentials are generated after compliance approval, stored hashed,
            scoped by API permission, and every rotation is written to audit log.
          </p>
        </section>

        <div className="role-form__actions">
          <Button type="button" variant="legacy" size="legacy">Save Draft</Button>
          <Button type="button" variant="legacy" size="legacy">Submit for Compliance Review</Button>
          <Button type="button" variant="legacy" size="legacy">Generate Sandbox Credentials</Button>
        </div>
      </form>
    </div>
  );
}

function BankAdminPage({ onBack }: { onBack: () => void }) {
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
      <form className="role-form">
        <section className="role-form__section">
          <h3>User Identity</h3>
          <label>
            <span>Full Name</span>
            <Input placeholder="Mekdes Alemu" />
          </label>
          <label>
            <span>Work Email</span>
            <Input type="email" placeholder="admin@bank.et" />
          </label>
          <label>
            <span>Mobile Number</span>
            <Input placeholder="+251..." />
          </label>
          <label>
            <span>Temporary Username</span>
            <Input placeholder="bank.admin" />
          </label>
        </section>

        <section className="role-form__section">
          <h3>Bank Scope</h3>
          <label>
            <span>Bank Tenant</span>
            <select defaultValue="abay">
              <option value="abay">Abay Bank</option>
              <option value="dashen">Dashen Bank</option>
              <option value="awash">Awash Bank</option>
            </select>
          </label>
          <label>
            <span>Primary Branch</span>
            <Input placeholder="Head Office" />
          </label>
          <label>
            <span>Role</span>
            <select defaultValue="BANK_ADMIN">
              <option value="BANK_ADMIN">Bank Admin</option>
            </select>
          </label>
          <label>
            <span>Status</span>
            <select defaultValue="invite">
              <option value="invite">Send activation invite</option>
              <option value="draft">Save as draft</option>
            </select>
          </label>
        </section>

        <section className="role-form__section role-form__section--wide">
          <h3>Permissions</h3>
          <div className="role-check-grid">
            <label><input type="checkbox" defaultChecked /> Manage bank profile</label>
            <label><input type="checkbox" defaultChecked /> Manage bank users</label>
            <label><input type="checkbox" defaultChecked /> Manage clients and limits</label>
            <label><input type="checkbox" defaultChecked /> View audit logs and reports</label>
          </div>
        </section>

        <div className="role-form__actions">
          <Button type="button" variant="legacy" size="legacy">Create User Draft</Button>
          <Button type="button" variant="legacy" size="legacy">Send Activation Invite</Button>
        </div>
      </form>
    </div>
  );
}

function CredentialsPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="role-panel role-page">
      <PageBackButton onBack={onBack} />
      <div className="role-page__header">
        <p className="role-panel__eyebrow">CORE BANKING INTEGRATION</p>
        <h2>Manage API Credentials</h2>
        <p>
          Generate scoped API credentials for sandbox or production core banking
          integrations and rotate secrets under audit control.
        </p>
      </div>
      <form className="role-form">
        <section className="role-form__section">
          <h3>Credential Request</h3>
          <label>
            <span>Bank</span>
            <select defaultValue="abay">
              <option value="abay">Abay Bank</option>
              <option value="dashen">Dashen Bank</option>
              <option value="awash">Awash Bank</option>
            </select>
          </label>
          <label>
            <span>Environment</span>
            <select defaultValue="sandbox">
              <option value="sandbox">Sandbox</option>
              <option value="production">Production</option>
            </select>
          </label>
          <label>
            <span>Client ID Prefix</span>
            <Input placeholder="abay-corebanking" />
          </label>
          <label>
            <span>Expiry</span>
            <Input type="date" />
          </label>
        </section>

        <section className="role-form__section">
          <h3>Scopes</h3>
          <div className="role-check-grid role-check-grid--stack">
            <label><input type="checkbox" defaultChecked /> lc:issue</label>
            <label><input type="checkbox" defaultChecked /> guarantee:read</label>
            <label><input type="checkbox" /> settlement:release</label>
            <label><input type="checkbox" /> kyc:verify</label>
            <label><input type="checkbox" /> risk:exposure</label>
          </div>
        </section>

        <section className="role-form__section role-form__section--wide">
          <h3>Active Credentials</h3>
          <div className="role-panel__table role-panel__table--embedded">
            <div className="role-panel__table-head">
              <span>Client ID</span>
              <span>Bank</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {[
              ["abay-corebanking-prod", "Abay Bank", "Active", "Rotate"],
              ["dashen-lc-sandbox", "Dashen Bank", "Sandbox", "Promote"],
            ].map((row) => (
              <div className="role-panel__table-row" key={row[0]}>
                {row.map((cell) => (
                  <span key={cell}>{cell}</span>
                ))}
              </div>
            ))}
          </div>
        </section>

        <div className="role-form__actions">
          <Button type="button" variant="legacy" size="legacy">Generate Sandbox Credential</Button>
          <Button type="button" variant="legacy" size="legacy">Request Production Approval</Button>
        </div>
      </form>
    </div>
  );
}

function SuperAdminPanel() {
  const [page, setPage] = useState<SuperAdminPage>("home");

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
    return <BankRegistrationPage onBack={() => setPage("home")} />;
  }

  if (page === "bank-admin") {
    return <BankAdminPage onBack={() => setPage("home")} />;
  }

  if (page === "credentials") {
    return <CredentialsPage onBack={() => setPage("home")} />;
  }

  return (
    <div className="role-panel role-panel--super-admin">
      <div className="role-panel__header">
        <div>
          <p className="role-panel__eyebrow">ANKUARU SUPER ADMIN</p>
          <h2>Bank Registry & Bank Admin Users</h2>
          <p>
            Register licensed banks, create their first Bank Admin users, and
            control API credentials for core banking integration.
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
          <strong>7</strong>
        </div>
        <div>
          <span>Pending Review</span>
          <strong>3</strong>
        </div>
        <div>
          <span>Bank Admin Users</span>
          <strong>12</strong>
        </div>
        <div>
          <span>API Credentials</span>
          <strong>5 active</strong>
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
            <KeyRound aria-hidden="true" />
          </div>
          <div>
            <h3>Core Banking API Credentials</h3>
            <p>
              Generate sandbox/production credentials, rotate secrets, audit
              access, and scope permissions by LC, settlement, and KYC APIs.
            </p>
          </div>
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            onClick={() => setPage("credentials")}
          >
            Manage Credentials
          </Button>
        </section>
      </div>

      <div className="role-panel__table">
        <div className="role-panel__table-head">
          <span>Bank</span>
          <span>Admin User</span>
          <span>Status</span>
          <span>Next Task</span>
        </div>
        {[
          ["Abay Bank", "Mekdes Alemu", "Active", "Rotate API credential"],
          ["Dashen Bank", "Pending", "Docs review", "Verify license"],
          ["Awash Bank", "Hana Bekele", "Active", "Review LC limits"],
        ].map((row) => (
          <div className="role-panel__table-row" key={row[0]}>
            {row.map((cell) => (
              <span key={cell}>{cell}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function BankInternalUsersPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="role-panel role-page">
      <PageBackButton onBack={onBack} label="Back to Bank Admin" />
      <div className="role-page__header">
        <p className="role-panel__eyebrow">BANK IAM</p>
        <h2>Internal Users & Roles</h2>
        <p>
          Create and manage bank staff with scoped roles: Onboarder, Verifier,
          Risk Officer, Compliance Officer, Viewer, and Auditor.
        </p>
      </div>
      <form className="role-form">
        <section className="role-form__section">
          <h3>Create Internal User</h3>
          <label><span>Full Name</span><Input placeholder="Hana Bekele" /></label>
          <label><span>Work Email</span><Input type="email" placeholder="hana@abaybank.et" /></label>
          <label><span>Branch / Desk</span><Input placeholder="Trade Finance · Head Office" /></label>
          <label>
            <span>Activation</span>
            <select defaultValue="invite">
              <option value="invite">Send activation invite</option>
              <option value="draft">Save as draft</option>
              <option value="active">Activate immediately</option>
            </select>
          </label>
        </section>

        <section className="role-form__section">
          <h3>Role Assignment</h3>
          <label>
            <span>Primary Role</span>
            <select defaultValue="BANK_VERIFIER">
              <option value="BANK_ONBOARDER">Onboarder / Relationship Manager</option>
              <option value="BANK_VERIFIER">Verifier / Credit Officer</option>
              <option value="BANK_RISK">Risk / Compliance Officer</option>
              <option value="BANK_VIEWER">Viewer / Auditor</option>
            </select>
          </label>
          <label><span>Approval Limit</span><Input placeholder="USD 250,000" /></label>
          <label><span>Commodity Scope</span><Input placeholder="Coffee, sesame" /></label>
          <label><span>Effective From</span><Input type="date" /></label>
        </section>

        <section className="role-form__section role-form__section--wide">
          <h3>Granular Permissions</h3>
          <div className="role-check-grid">
            <label><input type="checkbox" defaultChecked /> View bank clients</label>
            <label><input type="checkbox" /> Create client KYC case</label>
            <label><input type="checkbox" defaultChecked /> Review LC requests</label>
            <label><input type="checkbox" /> Issue guarantees</label>
            <label><input type="checkbox" /> Configure risk rules</label>
            <label><input type="checkbox" /> Export audit reports</label>
          </div>
        </section>

        <section className="role-form__section role-form__section--wide">
          <h3>Current Bank Users</h3>
          <div className="role-panel__table role-panel__table--embedded">
            <div className="role-panel__table-head">
              <span>User</span><span>Role</span><span>Status</span><span>Scope</span>
            </div>
            {[
              ["Mekdes Alemu", "Bank Admin", "Active", "All branches"],
              ["Hana Bekele", "Verifier", "Active", "LC approvals"],
              ["Solomon Tesfaye", "Risk Officer", "Active", "Exposure controls"],
            ].map((row) => (
              <div className="role-panel__table-row" key={row[0]}>
                {row.map((cell) => <span key={cell}>{cell}</span>)}
              </div>
            ))}
          </div>
        </section>

        <div className="role-form__actions">
          <Button type="button" variant="legacy" size="legacy">Save User</Button>
          <Button type="button" variant="legacy" size="legacy">Send Invite</Button>
        </div>
      </form>
    </div>
  );
}

function BankClientAccountsPage({ onBack }: { onBack: () => void }) {
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
          <label><span>Legal Name</span><Input placeholder="Nordic Imports B.V." /></label>
          <label>
            <span>Trader Type</span>
            <select defaultValue="buyer">
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="both">Buyer & Seller</option>
            </select>
          </label>
          <label><span>Registration / Tax ID</span><Input placeholder="Company registration number" /></label>
          <label><span>Relationship Manager</span><Input placeholder="Daniel Tadesse" /></label>
        </section>

        <section className="role-form__section">
          <h3>KYC & Risk</h3>
          <label>
            <span>KYC Status</span>
            <select defaultValue="pending">
              <option value="draft">Draft</option>
              <option value="pending">KYC pending</option>
              <option value="active">Approved / active</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>
          <label>
            <span>Risk Rating</span>
            <select defaultValue="medium">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label><span>EDD Notes</span><Input placeholder="Beneficial ownership / PEP / sanctions notes" /></label>
          <label><span>Permitted Commodities</span><Input placeholder="Coffee, sesame" /></label>
        </section>

        <section className="role-form__section role-form__section--wide">
          <h3>Enhanced Due Diligence Checklist</h3>
          <div className="role-check-grid">
            <label><input type="checkbox" defaultChecked /> Beneficial ownership verified</label>
            <label><input type="checkbox" /> Sanctions screening completed</label>
            <label><input type="checkbox" /> PEP/adverse media reviewed</label>
            <label><input type="checkbox" /> Source of funds validated</label>
            <label><input type="checkbox" /> Trade history reviewed</label>
            <label><input type="checkbox" /> Compliance officer sign-off</label>
          </div>
        </section>

        <section className="role-form__section role-form__section--wide">
          <h3>Trading Limits</h3>
          <div className="role-form__inline-grid">
            <label><span>Daily Limit</span><Input placeholder="USD 1,000,000" /></label>
            <label><span>Per Trade Limit</span><Input placeholder="USD 250,000" /></label>
            <label><span>Total Exposure Limit</span><Input placeholder="USD 5,000,000" /></label>
          </div>
          <div className="role-panel__table role-panel__table--embedded role-panel__table--limits">
            <div className="role-panel__table-head">
              <span>Commodity</span><span>Daily</span><span>Per Trade</span><span>Total Exposure</span>
            </div>
            {[
              ["Coffee", "USD 1.0m", "USD 250k", "USD 5.0m"],
              ["Sesame", "USD 500k", "USD 150k", "USD 2.0m"],
              ["Pulses", "USD 300k", "USD 100k", "USD 1.2m"],
            ].map((row) => (
              <div className="role-panel__table-row" key={row[0]}>
                {row.map((cell) => <span key={cell}>{cell}</span>)}
              </div>
            ))}
          </div>
        </section>

        <section className="role-form__section role-form__section--wide">
          <h3>All Clients Onboarded by This Bank</h3>
          <div className="role-client-summary">
            <div><span>Total clients</span><strong>42</strong></div>
            <div><span>Buyers</span><strong>24</strong></div>
            <div><span>Sellers</span><strong>15</strong></div>
            <div><span>High risk</span><strong>3</strong></div>
          </div>
          <div className="role-panel__table role-panel__table--embedded role-panel__table--clients">
            <div className="role-panel__table-head">
              <span>Client</span><span>Type</span><span>KYC</span><span>Risk</span><span>Limit</span><span>RM</span>
            </div>
            {[
              ["Nordic Imports B.V.", "Buyer", "Approved", "Medium", "USD 5.0m", "D. Tadesse"],
              ["Kaffa Trading PLC", "Seller", "Approved", "Low", "USD 2.5m", "M. Alemu"],
              ["Gulf Coffee DMCC", "Buyer", "EDD review", "High", "Manual review", "S. Tesfaye"],
              ["Addis Finest Commodities", "Buyer & Seller", "Pending docs", "Medium", "USD 1.5m", "H. Bekele"],
            ].map((row) => (
              <div className="role-panel__table-row" key={row[0]}>
                {row.map((cell) => <span key={cell}>{cell}</span>)}
              </div>
            ))}
          </div>
        </section>

        <div className="role-form__actions">
          <Button type="button" variant="legacy" size="legacy">Save Client Draft</Button>
          <Button type="button" variant="legacy" size="legacy">Submit KYC for Review</Button>
          <Button type="button" variant="legacy" size="legacy">Activate Trader</Button>
        </div>
      </form>
    </div>
  );
}

function BankRbacPage({ onBack }: { onBack: () => void }) {
  const rows = [
    ["Create client", "Yes", "Yes", "No", "No", "Read"],
    ["Approve KYC", "Yes", "No", "Yes", "Yes", "Read"],
    ["Issue guarantee", "Yes", "No", "Yes", "No", "Read"],
    ["Configure risk rules", "Yes", "No", "No", "Yes", "Read"],
    ["Emergency action", "Yes", "No", "No", "Yes", "Read"],
    ["Export audit reports", "Yes", "No", "Limited", "Yes", "Yes"],
  ];

  return (
    <div className="role-panel role-page">
      <PageBackButton onBack={onBack} label="Back to Bank Admin" />
      <div className="role-page__header">
        <p className="role-panel__eyebrow">RBAC</p>
        <h2>Granular Role-Based Access Control</h2>
        <p>
          Configure tenant permissions by role, product, approval limit,
          branch, commodity, and action sensitivity.
        </p>
      </div>
      <form className="role-form">
        <section className="role-form__section">
          <h3>Role Template</h3>
          <label>
            <span>Role</span>
            <select defaultValue="BANK_VERIFIER">
              <option value="BANK_ADMIN">Bank Admin</option>
              <option value="BANK_ONBOARDER">Onboarder</option>
              <option value="BANK_VERIFIER">Verifier / Credit Officer</option>
              <option value="BANK_RISK">Risk / Compliance Officer</option>
              <option value="BANK_VIEWER">Viewer / Auditor</option>
            </select>
          </label>
          <label><span>Branch Scope</span><Input placeholder="All branches or selected branch" /></label>
          <label><span>Approval Threshold</span><Input placeholder="USD 250,000" /></label>
        </section>

        <section className="role-form__section">
          <h3>Permission Groups</h3>
          <div className="role-check-grid role-check-grid--stack">
            <label><input type="checkbox" defaultChecked /> Client onboarding and KYC</label>
            <label><input type="checkbox" defaultChecked /> LC request review</label>
            <label><input type="checkbox" /> Guarantee issuance</label>
            <label><input type="checkbox" /> Risk rule configuration</label>
            <label><input type="checkbox" /> Settlement release approval</label>
            <label><input type="checkbox" /> Audit export</label>
          </div>
        </section>

        <section className="role-form__section role-form__section--wide">
          <h3>Permission Matrix</h3>
          <div className="role-panel__table role-panel__table--embedded role-panel__table--rbac">
            <div className="role-panel__table-head">
              <span>Permission</span><span>Admin</span><span>Onboarder</span><span>Verifier</span><span>Risk</span><span>Viewer</span>
            </div>
            {rows.map((row) => (
              <div className="role-panel__table-row" key={row[0]}>
                {row.map((cell) => <span key={cell}>{cell}</span>)}
              </div>
            ))}
          </div>
        </section>

        <div className="role-form__actions">
          <Button type="button" variant="legacy" size="legacy">Save Permission Draft</Button>
          <Button type="button" variant="legacy" size="legacy">Publish RBAC Policy</Button>
        </div>
      </form>
    </div>
  );
}

function BankAdminPanel({ session }: { session: AuthSession }) {
  const [page, setPage] = useState<BankAdminPageKey>("home");

  useEffect(() => {
    function handleNavigate(event: Event) {
      const nextPage = (event as CustomEvent<BankAdminPageKey>).detail;
      if (nextPage) setPage(nextPage);
    }

    window.addEventListener("ankuaru:bank-admin-page", handleNavigate);

    return () => {
      window.removeEventListener("ankuaru:bank-admin-page", handleNavigate);
    };
  }, []);

  if (page === "internal-users") return <BankInternalUsersPage onBack={() => setPage("home")} />;
  if (page === "client-accounts") return <BankClientAccountsPage onBack={() => setPage("home")} />;
  if (page === "rbac") return <BankRbacPage onBack={() => setPage("home")} />;

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
        <div><span>Internal Users</span><strong>18</strong></div>
        <div><span>Trader Clients</span><strong>42</strong></div>
        <div><span>Pending KYC</span><strong>6</strong></div>
        <div><span>RBAC Policies</span><strong>5</strong></div>
      </div>

      <div className="role-panel__grid">
        <section className="role-action-card">
          <div className="role-action-card__icon"><UserCog aria-hidden="true" /></div>
          <div>
            <h3>Internal Users</h3>
            <p>Create and manage Onboarders, Verifiers, Risk Officers, Viewers, branch scopes, approval limits, and activation status.</p>
          </div>
          <Button type="button" variant="legacy" size="legacy" onClick={() => setPage("internal-users")}>Manage Users</Button>
        </section>

        <section className="role-action-card">
          <div className="role-action-card__icon"><BriefcaseBusiness aria-hidden="true" /></div>
          <div>
            <h3>Client Trader Accounts</h3>
            <p>Onboard buyers and sellers, maintain KYC/EDD status, risk rating, commodity scope, and trading exposure limits.</p>
          </div>
          <Button type="button" variant="legacy" size="legacy" onClick={() => setPage("client-accounts")}>Manage Clients</Button>
        </section>

        <section className="role-action-card">
          <div className="role-action-card__icon"><SlidersHorizontal aria-hidden="true" /></div>
          <div>
            <h3>RBAC Permissions</h3>
            <p>Configure granular access across KYC, LC review, guarantee issuance, risk controls, settlement release, and audit reports.</p>
          </div>
          <Button type="button" variant="legacy" size="legacy" onClick={() => setPage("rbac")}>Configure RBAC</Button>
        </section>
      </div>
    </div>
  );
}

function RegisterAndOnboardClientPage({
  onBack,
  backLabel,
}: {
  onBack: () => void;
  backLabel: string;
}) {
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
          <label><span>Legal Name</span><Input placeholder="Nordic Imports B.V." /></label>
          <label>
            <span>Client Type</span>
            <select defaultValue="buyer">
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="both">Buyer & Seller</option>
            </select>
          </label>
          <label><span>Registration Number</span><Input placeholder="Company registration ID" /></label>
          <label><span>Tax ID</span><Input placeholder="TIN / VAT ID" /></label>
        </section>
        <section className="role-form__section">
          <h3>KYC / EDD</h3>
          <label><span>Beneficial Owner</span><Input placeholder="Ultimate beneficial owner" /></label>
          <label><span>Country / Jurisdiction</span><Input placeholder="Ethiopia, Netherlands, UAE..." /></label>
          <label>
            <span>Risk Rating</span>
            <select defaultValue="medium">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label><span>Relationship Manager</span><Input placeholder="Assigned bank officer" /></label>
        </section>
        <section className="role-form__section role-form__section--wide">
          <h3>Documents & Checks</h3>
          <div className="role-check-grid">
            <label><input type="checkbox" /> Business license collected</label>
            <label><input type="checkbox" /> Tax certificate collected</label>
            <label><input type="checkbox" /> Beneficial ownership verified</label>
            <label><input type="checkbox" /> Sanctions screening completed</label>
            <label><input type="checkbox" /> PEP/adverse media checked</label>
            <label><input type="checkbox" /> Source of funds reviewed</label>
          </div>
        </section>
        <section className="role-form__section role-form__section--wide">
          <h3>Requested Trading Limits</h3>
          <div className="role-form__inline-grid">
            <label><span>Daily Limit</span><Input placeholder="USD 1,000,000" /></label>
            <label><span>Per Trade Limit</span><Input placeholder="USD 250,000" /></label>
            <label><span>Commodity Scope</span><Input placeholder="Coffee, sesame" /></label>
          </div>
        </section>
        <div className="role-form__actions">
          <Button type="button" variant="legacy" size="legacy">Save Draft</Button>
          <Button type="button" variant="legacy" size="legacy">Submit for Verification</Button>
        </div>
      </form>
    </div>
  );
}

function ManageClientsPage({
  onBack,
  backLabel,
}: {
  onBack: () => void;
  backLabel: string;
}) {
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
        <div><span>Draft</span><strong>5</strong></div>
        <div><span>Pending verification</span><strong>8</strong></div>
        <div><span>More info</span><strong>3</strong></div>
        <div><span>Approved</span><strong>42</strong></div>
      </div>
      <div className="role-panel__table role-panel__table--clients">
        <div className="role-panel__table-head">
          <span>Client</span><span>Type</span><span>KYC</span><span>Risk</span><span>Limit</span><span>Owner</span>
        </div>
        {[
          ["Nordic Imports B.V.", "Buyer", "Pending verifier", "Medium", "USD 5.0m", "D. Tadesse"],
          ["Kaffa Trading PLC", "Seller", "Approved", "Low", "USD 2.5m", "M. Alemu"],
          ["Gulf Coffee DMCC", "Buyer", "More info", "High", "Hold", "H. Bekele"],
          ["Addis Finest Commodities", "Both", "Draft", "Medium", "Requested", "D. Tadesse"],
        ].map((row) => (
          <div className="role-panel__table-row" key={row[0]}>
            {row.map((cell) => <span key={cell}>{cell}</span>)}
          </div>
        ))}
      </div>
    </div>
  );
}

function VerificationPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="role-panel role-page">
      <PageBackButton onBack={onBack} label="Back to Verifier" />
      <div className="role-page__header">
        <p className="role-panel__eyebrow">CREDIT VERIFICATION</p>
        <h2>Check & Complete Verification</h2>
        <p>
          Review KYC/EDD, documents, collateral, requested limits, and approve,
          reject, or request more information.
        </p>
      </div>
      <form className="role-form">
        <section className="role-form__section">
          <h3>Case Review</h3>
          <label><span>Client</span><Input value="Nordic Imports B.V." readOnly /></label>
          <label><span>Requested Product</span><Input value="Sight LC · Coffee" readOnly /></label>
          <label><span>Requested Limit</span><Input value="USD 5,000,000" readOnly /></label>
          <label>
            <span>Decision</span>
            <select defaultValue="more-info">
              <option value="approve">Approve</option>
              <option value="reject">Reject</option>
              <option value="more-info">Request more information</option>
            </select>
          </label>
        </section>
        <section className="role-form__section">
          <h3>Verification Checklist</h3>
          <div className="role-check-grid role-check-grid--stack">
            <label><input type="checkbox" defaultChecked /> KYC documents complete</label>
            <label><input type="checkbox" defaultChecked /> Collateral reviewed</label>
            <label><input type="checkbox" /> Credit exposure approved</label>
            <label><input type="checkbox" /> Compliance sign-off complete</label>
          </div>
        </section>
        <section className="role-form__section role-form__section--wide">
          <h3>Reviewer Notes</h3>
          <label><span>Notes</span><Input placeholder="Document condition, collateral comments, exceptions..." /></label>
        </section>
        <div className="role-form__actions">
          <Button type="button" variant="legacy" size="legacy">Request Info</Button>
          <Button type="button" variant="legacy" size="legacy">Approve Verification</Button>
        </div>
      </form>
    </div>
  );
}

function IssueLetterOfCreditPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="role-panel role-page">
      <PageBackButton onBack={onBack} label="Back to Verifier" />
      <div className="role-page__header">
        <p className="role-panel__eyebrow">LETTER OF CREDIT</p>
        <h2>Issue Letter of Credit</h2>
        <p>
          Issue a digital LC linked to a trade or contract with expiry, tenor,
          amount, collateral, and blockchain anchor metadata.
        </p>
      </div>
      <form className="role-form">
        <section className="role-form__section">
          <h3>LC Terms</h3>
          <label><span>Applicant / Buyer</span><Input placeholder="Nordic Imports B.V." /></label>
          <label><span>Beneficiary / Seller</span><Input placeholder="Kaffa Trading PLC" /></label>
          <label>
            <span>LC Type</span>
            <select defaultValue="sight">
              <option value="sight">Sight LC</option>
              <option value="usance">Usance LC</option>
              <option value="bond">Performance Bond</option>
              <option value="blocked">Blocked Funds</option>
            </select>
          </label>
          <label><span>Amount</span><Input placeholder="USD 250,000" /></label>
        </section>
        <section className="role-form__section">
          <h3>Contract Linkage</h3>
          <label><span>ANKUARU Contract UID</span><Input placeholder="CTR-2026-00091" /></label>
          <label><span>Expiry Date</span><Input type="date" /></label>
          <label><span>Collateral Reference</span><Input placeholder="Blocked deposit / credit line ref" /></label>
          <label><span>PDF Template</span><Input placeholder="NBE compliant LC template v1" /></label>
        </section>
        <div className="role-form__actions">
          <Button type="button" variant="legacy" size="legacy">Generate Draft PDF</Button>
          <Button type="button" variant="legacy" size="legacy">Issue Digital LC</Button>
        </div>
      </form>
    </div>
  );
}

function GenerateContractPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="role-panel role-page">
      <PageBackButton onBack={onBack} label="Back to Verifier" />
      <div className="role-page__header">
        <p className="role-panel__eyebrow">CONTRACTING</p>
        <h2>Generate Bank-Backed Contract</h2>
        <p>
          Generate a contract from verified client, LC terms, commodity lot,
          delivery obligations, and settlement triggers.
        </p>
      </div>
      <form className="role-form">
        <section className="role-form__section">
          <h3>Parties</h3>
          <label><span>Buyer</span><Input placeholder="Nordic Imports B.V." /></label>
          <label><span>Seller</span><Input placeholder="Kaffa Trading PLC" /></label>
          <label><span>Guarantee / LC UID</span><Input placeholder="LC-ABY-2026-0091" /></label>
          <label><span>Contract Type</span><Input placeholder="Coffee export sale · FOB Djibouti" /></label>
        </section>
        <section className="role-form__section">
          <h3>Trade Terms</h3>
          <label><span>Commodity</span><Input placeholder="Ethiopian coffee · Jimma G5" /></label>
          <label><span>Quantity</span><Input placeholder="17.8t" /></label>
          <label><span>Price</span><Input placeholder="USD/kg or differential" /></label>
          <label><span>Settlement Trigger</span><Input placeholder="Warehouse + BL confirmation" /></label>
        </section>
        <div className="role-form__actions">
          <Button type="button" variant="legacy" size="legacy">Preview Contract</Button>
          <Button type="button" variant="legacy" size="legacy">Generate Contract</Button>
        </div>
      </form>
    </div>
  );
}

function ClientRegistrationPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="role-panel role-page">
      <PageBackButton onBack={onBack} label="Back to Client" />
      <div className="role-page__header">
        <p className="role-panel__eyebrow">CLIENT SELF-SERVICE</p>
        <h2>Registration & Onboarding</h2>
        <p>
          Submit company profile, role, documents, bank relationship, and
          requested trading limits to begin onboarding.
        </p>
      </div>
      <form className="role-form">
        <section className="role-form__section">
          <h3>Company Profile</h3>
          <label><span>Legal Name</span><Input placeholder="Company name" /></label>
          <label><span>Email</span><Input type="email" placeholder="ops@company.com" /></label>
          <label>
            <span>Role</span>
            <select defaultValue="buyer">
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="both">Buyer & Seller</option>
            </select>
          </label>
          <label><span>Preferred Bank</span><Input placeholder="Abay Bank" /></label>
        </section>
        <section className="role-form__section">
          <h3>Documents</h3>
          <div className="role-check-grid role-check-grid--stack">
            <label><input type="checkbox" /> Trade license ready</label>
            <label><input type="checkbox" /> Tax certificate ready</label>
            <label><input type="checkbox" /> Beneficial owner declaration ready</label>
            <label><input type="checkbox" /> Bank reference ready</label>
          </div>
        </section>
        <div className="role-form__actions">
          <Button type="button" variant="legacy" size="legacy">Save Draft</Button>
          <Button type="button" variant="legacy" size="legacy">Submit Onboarding</Button>
        </div>
      </form>
    </div>
  );
}

function ClientStatusPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="role-panel role-page">
      <PageBackButton onBack={onBack} label="Back to Client" />
      <div className="role-page__header">
        <p className="role-panel__eyebrow">ONBOARDING STATUS</p>
        <h2>Track Status</h2>
        <p>
          Track onboarding, KYC, verification, LC requests, and contract
          readiness from one client-facing status page.
        </p>
      </div>
      <div className="role-panel__table">
        <div className="role-panel__table-head">
          <span>Stage</span><span>Status</span><span>Owner</span><span>Next Step</span>
        </div>
        {[
          ["Registration", "Submitted", "Client", "Await bank review"],
          ["KYC / EDD", "In progress", "Abay Bank", "Upload beneficial owner docs"],
          ["Risk rating", "Pending", "Risk Officer", "Review exposure"],
          ["LC request", "Not started", "Verifier", "Submit trade reference"],
          ["Trading access", "Locked", "Platform", "Complete onboarding"],
        ].map((row) => (
          <div className="role-panel__table-row" key={row[0]}>
            {row.map((cell) => <span key={cell}>{cell}</span>)}
          </div>
        ))}
      </div>
    </div>
  );
}

function OnboarderPanel({ session }: { session: AuthSession }) {
  const [page, setPage] = useState<OnboarderPageKey>("home");

  useEffect(() => {
    function handleNavigate(event: Event) {
      const nextPage = (event as CustomEvent<OnboarderPageKey>).detail;
      if (nextPage) setPage(nextPage);
    }
    window.addEventListener("ankuaru:onboarder-page", handleNavigate);
    return () => window.removeEventListener("ankuaru:onboarder-page", handleNavigate);
  }, []);

  if (page === "register-client") return <RegisterAndOnboardClientPage onBack={() => setPage("home")} backLabel="Back to Onboarder" />;
  if (page === "manage-clients") return <ManageClientsPage onBack={() => setPage("home")} backLabel="Back to Onboarder" />;

  return (
    <div className="role-panel role-panel--super-admin">
      <div className="role-panel__header">
        <div>
          <p className="role-panel__eyebrow">ONBOARDER · {session.bankName}</p>
          <h2>Client Registration & Onboarding</h2>
          <p>Register new clients, collect KYC/EDD documents, and manage client onboarding cases.</p>
        </div>
        <div className="role-panel__badge"><UsersRound aria-hidden="true" /> Client desk</div>
      </div>
      <div className="role-panel__grid">
        <section className="role-action-card">
          <div className="role-action-card__icon"><UserPlus aria-hidden="true" /></div>
          <div><h3>Register & Onboard Clients</h3><p>Create buyer/seller profiles, collect documents, and submit cases for verification.</p></div>
          <Button type="button" variant="legacy" size="legacy" onClick={() => setPage("register-client")}>Start Onboarding</Button>
        </section>
        <section className="role-action-card">
          <div className="role-action-card__icon"><BriefcaseBusiness aria-hidden="true" /></div>
          <div><h3>Check & Manage Clients</h3><p>Review onboarding status, missing information, risk level, and assigned owner.</p></div>
          <Button type="button" variant="legacy" size="legacy" onClick={() => setPage("manage-clients")}>Manage Clients</Button>
        </section>
      </div>
    </div>
  );
}

function VerifierPanel({ session }: { session: AuthSession }) {
  const [page, setPage] = useState<VerifierPageKey>("home");

  useEffect(() => {
    function handleNavigate(event: Event) {
      const nextPage = (event as CustomEvent<VerifierPageKey>).detail;
      if (nextPage) setPage(nextPage);
    }
    window.addEventListener("ankuaru:verifier-page", handleNavigate);
    return () => window.removeEventListener("ankuaru:verifier-page", handleNavigate);
  }, []);

  if (page === "register-client") return <RegisterAndOnboardClientPage onBack={() => setPage("home")} backLabel="Back to Verifier" />;
  if (page === "manage-clients") return <ManageClientsPage onBack={() => setPage("home")} backLabel="Back to Verifier" />;
  if (page === "verification") return <VerificationPage onBack={() => setPage("home")} />;
  if (page === "issue-lc") return <IssueLetterOfCreditPage onBack={() => setPage("home")} />;
  if (page === "generate-contract") return <GenerateContractPage onBack={() => setPage("home")} />;

  return (
    <div className="role-panel role-panel--super-admin">
      <div className="role-panel__header">
        <div>
          <p className="role-panel__eyebrow">VERIFIER · {session.bankName}</p>
          <h2>Verification, LC & Contract Desk</h2>
          <p>Onboard clients, complete verification, issue letters of credit, and generate bank-backed contracts.</p>
        </div>
        <div className="role-panel__badge"><ShieldCheck aria-hidden="true" /> Credit officer</div>
      </div>
      <div className="role-panel__grid">
        {[
          ["register-client", "Register & Onboard Clients", "Create or complete client onboarding cases.", UserPlus],
          ["manage-clients", "Check & Manage Clients", "Review clients and pending information.", BriefcaseBusiness],
          ["verification", "Complete Verification", "Approve, reject, or request more information.", ShieldCheck],
          ["issue-lc", "Issue Letter of Credit", "Issue a digital LC against a trade or contract.", KeyRound],
          ["generate-contract", "Generate Contract", "Generate a bank-backed trade contract.", Building2],
        ].map(([id, title, desc, Icon]) => (
          <section className="role-action-card" key={String(id)}>
            <div className="role-action-card__icon"><Icon aria-hidden="true" /></div>
            <div><h3>{String(title)}</h3><p>{String(desc)}</p></div>
            <Button type="button" variant="legacy" size="legacy" onClick={() => setPage(id as VerifierPageKey)}>Open</Button>
          </section>
        ))}
      </div>
    </div>
  );
}

function ClientPanel({ session }: { session: AuthSession }) {
  const [page, setPage] = useState<ClientPageKey>("home");

  useEffect(() => {
    function handleNavigate(event: Event) {
      const nextPage = (event as CustomEvent<ClientPageKey>).detail;
      if (nextPage) setPage(nextPage);
    }
    window.addEventListener("ankuaru:client-page", handleNavigate);
    return () => window.removeEventListener("ankuaru:client-page", handleNavigate);
  }, []);

  if (page === "registration") return <ClientRegistrationPage onBack={() => setPage("home")} />;
  if (page === "status") return <ClientStatusPage onBack={() => setPage("home")} />;

  return (
    <div className="role-panel role-panel--super-admin">
      <div className="role-panel__header">
        <div>
          <p className="role-panel__eyebrow">CLIENT · {session.name}</p>
          <h2>Registration & Status Tracking</h2>
          <p>Register for ANKUARU trading access and track bank-led onboarding, verification, and LC readiness.</p>
        </div>
        <div className="role-panel__badge"><BriefcaseBusiness aria-hidden="true" /> Client portal</div>
      </div>
      <div className="role-panel__grid">
        <section className="role-action-card">
          <div className="role-action-card__icon"><UserPlus aria-hidden="true" /></div>
          <div><h3>Registration & Onboarding</h3><p>Submit your company, documents, bank relationship, and requested limits.</p></div>
          <Button type="button" variant="legacy" size="legacy" onClick={() => setPage("registration")}>Start Registration</Button>
        </section>
        <section className="role-action-card">
          <div className="role-action-card__icon"><SlidersHorizontal aria-hidden="true" /></div>
          <div><h3>Track Status</h3><p>Track KYC, EDD, bank review, LC requests, and trading access readiness.</p></div>
          <Button type="button" variant="legacy" size="legacy" onClick={() => setPage("status")}>Track Status</Button>
        </section>
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

  return <DefaultRolePanel session={session} />;
}
