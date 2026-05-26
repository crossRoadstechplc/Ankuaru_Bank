"use client";

import { Button } from "@/components/ui/button";
import { callLegacy } from "./legacy-actions";

export function ListingWizardOverlay() {
  return (
    <div className="wizard-ov" id="l4-wiz-ov">
      <div className="wizard" style={{ maxWidth: 600 }}>
        <div className="wiz-head">
          <div>
            <div className="wiz-title">New Listing</div>
            <div style={{ fontSize: 11, color: "var(--tx3)", marginTop: 2 }}>
              Matchmaking & Price Discovery
            </div>
          </div>
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            className="wiz-cl"
            onClick={() => callLegacy((win) => win.closeL4Wiz?.())}
          >
            ×
          </Button>
        </div>
        <div id="l4-wiz-body" style={{ padding: 20 }} />
      </div>
    </div>
  );
}

export function ContractWizardOverlay() {
  return (
    <div className="wizard-ov" id="wizard-ov">
      <div className="wizard">
        <div className="wiz-head">
          <div>
            <div className="wiz-title" id="wiz-title">
              New Contract
            </div>
            <div className="wiz-steps-row" id="wiz-steps-row" />
          </div>
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            className="wiz-cl"
            onClick={() => callLegacy((win) => win.closeWizard?.())}
          >
            ×
          </Button>
        </div>
        <div className="wiz-body" id="wiz-body" />
        <div className="wiz-foot">
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            className="wiz-back"
            id="wiz-back"
            onClick={() => callLegacy((win) => win.wizBack?.())}
          >
            ← Back
          </Button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{ fontSize: 11, color: "var(--tx3)" }}
              id="wiz-step-lbl"
            />
            <Button
              type="button"
              variant="legacy"
              size="legacy"
              className="wiz-next"
              id="wiz-next"
              onClick={() => callLegacy((win) => win.wizNext?.())}
            >
              Next →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationsOverlay() {
  return (
    <>
      <div
        className="np-ov"
        id="np-ov"
        onClick={() => callLegacy((win) => win.toggleNotif?.())}
      />
      <div className="notif-pnl" id="notif-pnl">
        <div className="np-head">
          <div className="np-title">Notifications</div>
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            className="np-cl"
            onClick={() => callLegacy((win) => win.toggleNotif?.())}
          >
            ×
          </Button>
        </div>
        <div className="np-body" id="np-body" />
      </div>
    </>
  );
}

export function MilestonePopover() {
  return (
    <div
      className="ms-pop"
      id="ms-pop"
      onMouseEnter={() => callLegacy((win) => win.cancelCloseMsPop?.())}
      onMouseLeave={() => callLegacy((win) => win.scheduleCloseMsPop?.())}
    >
      <Button
        type="button"
        variant="legacy"
        size="legacy"
        className="ms-pop-cl"
        aria-label="Close"
        onClick={() => callLegacy((win) => win.closeMsPop?.())}
      >
        ×
      </Button>
      <div id="ms-pop-body" />
    </div>
  );
}

export function UidPanel() {
  return (
    <>
      <div
        className="uid-ov"
        id="uid-ov"
        onClick={() => callLegacy((win) => win.closeUID?.())}
      />
      <div className="uid-pnl" id="uid-pnl">
        <div className="uid-handle" />
        <div className="uid-ph">
          <div id="uid-ph-id" />
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 17,
              color: "var(--tx3)",
            }}
            onClick={() => callLegacy((win) => win.closeUID?.())}
          >
            ×
          </Button>
        </div>
        <div className="uid-pb" id="uid-pb" />
      </div>
    </>
  );
}

export function HarvestMapOverlay() {
  return (
    <div
      id="hrv-map-ov"
      className="hrv-map-ov"
      onClick={() => callLegacy((win) => win.closeHrvMapModal?.())}
      aria-hidden="true"
    >
      <div
        className="hrv-map-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hrv-map-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="hrv-map-head">
          <div>
            <div id="hrv-map-title" className="hrv-map-title">
              Harvest batches
            </div>
            <div id="hrv-map-sub" className="hrv-map-sub" />
          </div>
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            className="hrv-map-x"
            aria-label="Close map"
            onClick={() => callLegacy((win) => win.closeHrvMapModal?.())}
          >
            ×
          </Button>
        </div>
        <div className="hrv-map-mapwrap">
          <div id="hrv-map-host" className="hrv-map-host" />
          <div id="hrv-map-summary" className="hrv-map-summary" hidden />
        </div>
        <p className="hrv-map-foot">
          Focused view: ~300 merged demo parcels (adjacent atoms grouped into
          larger rectangles) plus one reserved grid cell for the trace parcel
          (same scale as a single atom, inset like neighbours). Narrow road
          bands. Street / Terrain / Satellite (default terrain). Demo only.
        </p>
      </div>
    </div>
  );
}

export function Overlays() {
  return (
    <>
      <ListingWizardOverlay />
      <ContractWizardOverlay />
      <NotificationsOverlay />
      <MilestonePopover />
      <UidPanel />
      <HarvestMapOverlay />
    </>
  );
}
