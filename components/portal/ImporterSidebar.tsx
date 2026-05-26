"use client";

import {
  BadgeHelp,
  BriefcaseBusiness,
  CircleUserRound,
  CreditCard,
  FileText,
  FolderOpen,
  Gavel,
  Landmark,
  Package,
  PlusSquare,
  Repeat2,
  Settings,
  Shield,
  Sparkles,
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

export function ImporterSidebar({ session }: { session: AuthSession }) {
  const portalLabel = session.role.startsWith("BANK_")
    ? "Bank Portal"
    : session.role === "SUPER_ADMIN"
      ? "Super Admin"
      : "Trading Portal";

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
        {navItems.map((item) => (
          <SidebarButton key={item.id} item={item} session={session} />
        ))}
        <div className="bs-navdiv" />
        {utilityItems.map((item) => (
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
