"use client";

import {
  BadgeHelp,
  Building2,
  BriefcaseBusiness,
  CircleUserRound,
  CreditCard,
  FileText,
  FolderOpen,
  Gavel,
  Landmark,
  KeyRound,
  Package,
  PlusSquare,
  Repeat2,
  Settings,
  Shield,
  Sparkles,
  SlidersHorizontal,
  UserCog,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { AuthSession } from "@/components/auth/auth-model";
import { Button } from "@/components/ui/button";
import { callLegacy } from "./legacy-actions";

const navItems = [
  {
    id: "auction",
    label: "Auction",
    title: "Auctions & matchmaking — live listings",
    icon: Gavel,
    onClick: (button: HTMLButtonElement) =>
      callLegacy((win) => win.openAuctionFromSidebar?.(button)),
  },
  { id: "contracts", label: "Contracts", icon: FileText },
  { id: "financing", label: "Financing", icon: CreditCard },
  { id: "inv", label: "Inventory", icon: Package },
  { id: "insurance", label: "Insurance", icon: Shield },
  { id: "quality", label: "Quality and Labs", icon: Sparkles },
  { id: "settlement", label: "Settlement", icon: Repeat2 },
  { id: "actors", label: "Actors & Identity", icon: UsersRound },
  {
    id: "exporters",
    label: "Exporters",
    title: "Portfolio — exporters, lots, and shipment views",
    icon: BriefcaseBusiness,
  },
] as const;

const utilityItems = [
  { id: "new", label: "New Contract", icon: PlusSquare },
  { id: "open", label: "Open", icon: FolderOpen },
  { id: "risk", label: "Risk", icon: Landmark },
  { id: "account", label: "Account", icon: CircleUserRound },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "help", label: "Help", icon: BadgeHelp },
] as const;

const superAdminItems = [
  { id: "bank-registration", label: "Register Bank", icon: Building2 },
  { id: "bank-admin", label: "Create Bank Admin", icon: UserPlus },
  { id: "credentials", label: "API Credentials", icon: KeyRound },
] as const;

const bankAdminItems = [
  { id: "internal-users", label: "Internal Users", icon: UserCog },
  { id: "client-accounts", label: "Client Accounts", icon: BriefcaseBusiness },
  { id: "rbac", label: "RBAC Permissions", icon: SlidersHorizontal },
] as const;

const onboarderItems = [
  { id: "register-client", label: "Register Client", icon: UserPlus },
  { id: "manage-clients", label: "Manage Clients", icon: BriefcaseBusiness },
] as const;

const verifierItems = [
  { id: "register-client", label: "Register Client", icon: UserPlus },
  { id: "manage-clients", label: "Manage Clients", icon: BriefcaseBusiness },
  { id: "verification", label: "Complete Verification", icon: Shield },
  { id: "issue-lc", label: "Issue LC", icon: KeyRound },
  { id: "generate-contract", label: "Generate Contract", icon: FileText },
] as const;

const clientItems = [
  { id: "registration", label: "Registration", icon: UserPlus },
  { id: "status", label: "Track Status", icon: SlidersHorizontal },
] as const;

const roleMenuAccess: Record<
  AuthSession["role"],
  { nav: string[]; utility: string[] }
> = {
  SUPER_ADMIN: {
    nav: [],
    utility: ["risk", "account", "settings", "help"],
  },
  BANK_ADMIN: {
    nav: ["contracts", "settlement", "actors"],
    utility: ["risk", "account", "settings", "help"],
  },
  BANK_ONBOARDER: {
    nav: [],
    utility: ["account", "help"],
  },
  BANK_VERIFIER: {
    nav: ["contracts", "settlement"],
    utility: ["account", "help"],
  },
  BANK_RISK: {
    nav: ["contracts", "settlement"],
    utility: ["risk", "account", "help"],
  },
  CLIENT: {
    nav: ["auction", "exporters"],
    utility: ["account", "help"],
  },
  WAREHOUSE_OPERATOR: {
    nav: ["inv", "quality", "settlement"],
    utility: ["account", "help"],
  },
  REGULATOR: {
    nav: ["contracts", "settlement"],
    utility: ["risk", "account", "help"],
  },
};

function visibleNavItems(role: AuthSession["role"]) {
  const allowed = new Set(roleMenuAccess[role].nav);
  return navItems.filter((item) => allowed.has(item.id));
}

function visibleUtilityItems(role: AuthSession["role"]) {
  const allowed = new Set(roleMenuAccess[role].utility);
  return utilityItems.filter((item) => allowed.has(item.id));
}

function BrandLockup() {
  return (
    <div
      id="qat-brand-root"
      className="qat-brand-lockup"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 10px",
        borderRight: "1px solid #2e2010",
        marginRight: 8,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 50,
          height: 50,
          borderRadius: "50%",
          border: "1.5px solid #c4a06a",
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(135deg,#5a3514,#d4820a)",
          color: "#1a1208",
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        A
      </div>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#e8d4a8",
            letterSpacing: ".05em",
          }}
        >
          ANKUARU
        </div>
        <div style={{ fontSize: 8, color: "#9a8a7a", letterSpacing: ".04em" }}>
          TRACK & TRADE
        </div>
      </div>
    </div>
  );
}

function getRoleLabel(session: AuthSession, id: string, fallback: string) {
  if (!session.role.startsWith("BANK_")) return fallback;

  const bankLabels: Record<string, string> = {
    contracts: "LCs & Guarantees",
    financing: "Core Banking",
    actors: "Clients & KYC",
    settlement: "DvP Settlement",
    risk: "Risk Controls",
    inv: "Collateral Inventory",
  };

  return bankLabels[id] ?? fallback;
}

function SidebarButton({
  item,
  session,
}: {
  item: (typeof navItems)[number] | (typeof utilityItems)[number];
  session: AuthSession;
}) {
  const Icon = item.icon;

  return (
    <Button
      type="button"
      variant="legacy"
      size="legacy"
      className="bs-navitem"
      id={`bsn-${item.id}`}
      title={"title" in item ? item.title : undefined}
      onClick={(event) => {
        if ("onClick" in item && item.onClick) {
          item.onClick(event.currentTarget);
          return;
        }
        callLegacy((win) =>
          win.showBsSection?.(item.id, event.currentTarget),
        );
      }}
    >
      <Icon aria-hidden="true" />
      {getRoleLabel(session, item.id, item.label)}
    </Button>
  );
}

function SuperAdminSidebarButton({
  item,
}: {
  item: (typeof superAdminItems)[number];
}) {
  const Icon = item.icon;

  return (
    <Button
      type="button"
      variant="legacy"
      size="legacy"
      className="bs-navitem"
      onClick={() => {
        callLegacy((win) => win.showBsPortfolioPreview?.());
        window.dispatchEvent(
          new CustomEvent("ankuaru:super-admin-page", { detail: item.id }),
        );
      }}
    >
      <Icon aria-hidden="true" />
      {item.label}
    </Button>
  );
}

function BankAdminSidebarButton({
  item,
}: {
  item: (typeof bankAdminItems)[number];
}) {
  const Icon = item.icon;

  return (
    <Button
      type="button"
      variant="legacy"
      size="legacy"
      className="bs-navitem"
      onClick={() => {
        callLegacy((win) => win.showBsPortfolioPreview?.());
        window.dispatchEvent(
          new CustomEvent("ankuaru:bank-admin-page", { detail: item.id }),
        );
      }}
    >
      <Icon aria-hidden="true" />
      {item.label}
    </Button>
  );
}

function RoleEventSidebarButton({
  item,
  eventName,
}: {
  item:
    | (typeof onboarderItems)[number]
    | (typeof verifierItems)[number]
    | (typeof clientItems)[number];
  eventName: string;
}) {
  const Icon = item.icon;

  return (
    <Button
      type="button"
      variant="legacy"
      size="legacy"
      className="bs-navitem"
      onClick={() => {
        callLegacy((win) => win.showBsPortfolioPreview?.());
        window.dispatchEvent(
          new CustomEvent(eventName, { detail: item.id }),
        );
      }}
    >
      <Icon aria-hidden="true" />
      {item.label}
    </Button>
  );
}

export function ImporterSidebar({ session }: { session: AuthSession }) {
  const portalLabel = session.role.startsWith("BANK_")
    ? "Bank Portal"
    : session.role === "SUPER_ADMIN"
      ? "Super Admin"
      : "Trading Portal";
  const permittedNavItems = visibleNavItems(session.role);
  const permittedUtilityItems = visibleUtilityItems(session.role);

  return (
    <div className="bs-sidebar">
      <div className="bs-logo">
        <div className="bs-logo-inner">
          <div className="bs-brand-slot" id="bs-brand-slot">
            <BrandLockup />
          </div>
          <div className="bs-logo-portal">{portalLabel}</div>
        </div>
        <Button
          type="button"
          variant="legacy"
          size="legacy"
          className="bs-sidebar-toggle"
          id="bs-nav-toggle"
          aria-expanded="true"
          title="Hide importer menu"
          onClick={() => callLegacy((win) => win.toggleBsImporterNav?.())}
        >
          ⟨
        </Button>
      </div>
      <nav className="bs-nav">
        {session.role === "SUPER_ADMIN" ? (
          <>
            {superAdminItems.map((item) => (
              <SuperAdminSidebarButton key={item.id} item={item} />
            ))}
            <div className="bs-navdiv" />
          </>
        ) : null}
        {session.role === "BANK_ADMIN" ? (
          <>
            {bankAdminItems.map((item) => (
              <BankAdminSidebarButton key={item.id} item={item} />
            ))}
            <div className="bs-navdiv" />
          </>
        ) : null}
        {session.role === "BANK_ONBOARDER" ? (
          <>
            {onboarderItems.map((item) => (
              <RoleEventSidebarButton
                key={item.id}
                item={item}
                eventName="ankuaru:onboarder-page"
              />
            ))}
            <div className="bs-navdiv" />
          </>
        ) : null}
        {session.role === "BANK_VERIFIER" ? (
          <>
            {verifierItems.map((item) => (
              <RoleEventSidebarButton
                key={item.id}
                item={item}
                eventName="ankuaru:verifier-page"
              />
            ))}
            <div className="bs-navdiv" />
          </>
        ) : null}
        {session.role === "CLIENT" ? (
          <>
            {clientItems.map((item) => (
              <RoleEventSidebarButton
                key={item.id}
                item={item}
                eventName="ankuaru:client-page"
              />
            ))}
            <div className="bs-navdiv" />
          </>
        ) : null}
        {permittedNavItems.length > 0 ? (
          <>
            {permittedNavItems.map((item) => (
              <SidebarButton key={item.id} item={item} session={session} />
            ))}
            <div className="bs-navdiv" />
          </>
        ) : null}
        {permittedUtilityItems.map((item) => (
          <SidebarButton key={item.id} item={item} session={session} />
        ))}
      </nav>
      <Button
        type="button"
        variant="legacy"
        size="legacy"
        className="bs-back"
        onClick={() => callLegacy((win) => win.closeBackstage?.())}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M10 3L5 8l5 5" />
        </svg>
        Back to Portfolio
      </Button>
    </div>
  );
}
