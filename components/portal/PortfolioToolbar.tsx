"use client";

import { Button } from "@/components/ui/button";
import { callLegacy } from "./legacy-actions";

const statuses = [
  { label: "All", value: null, active: true },
  { label: "Pending", value: "PENDING" },
  { label: "Dispatched", value: "DISPATCHED" },
  { label: "Exported", value: "EXPORTED" },
] as const;

export function PortfolioToolbar() {
  return (
    <div className="main-toolbar">
      <span style={{ fontSize: 10, color: "var(--tx3)" }}>Status:</span>
      {statuses.map((status) => (
        <Button
          key={status.label}
          type="button"
          variant="legacy"
          size="legacy"
          className={`tp${"active" in status && status.active ? " on" : ""}`}
          onClick={(event) =>
            callLegacy((win) =>
              win.filterSt?.(status.value, event.currentTarget),
            )
          }
        >
          {status.label}
        </Button>
      ))}
      <div className="tp-sep" />
      <span style={{ fontSize: 10, color: "var(--tx3)" }}>View:</span>
      <Button
        type="button"
        variant="legacy"
        size="legacy"
        className="tp on"
        id="v-cards"
        onClick={(event) =>
          callLegacy((win) => win.setView?.("cards", event.currentTarget))
        }
      >
        Cards
      </Button>
      <Button
        type="button"
        variant="legacy"
        size="legacy"
        className="tp"
        id="v-timeline"
        onClick={(event) =>
          callLegacy((win) => win.setView?.("timeline", event.currentTarget))
        }
      >
        Timeline
      </Button>
      <Button
        type="button"
        variant="legacy"
        size="legacy"
        className="tp"
        id="v-fieldmap"
        title="Merged parcel field map — explore all demo plots (current shipment, no trace subject)"
        aria-label="Open field map"
        onClick={() => callLegacy((win) => win.openToolbarFieldMap?.())}
      >
        Field map
      </Button>
    </div>
  );
}
