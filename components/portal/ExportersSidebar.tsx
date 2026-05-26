"use client";

import { Button } from "@/components/ui/button";
import { callLegacy } from "./legacy-actions";

export function ExportersSidebar() {
  return (
    <>
      <div className="sidebar" id="exporters-sidebar" hidden>
        <div className="sb-head">
          <div className="sb-head-lbl">Exporters</div>
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            className="sb-all on"
            id="btn-all"
            onClick={(event) =>
              callLegacy((win) => win.filterExp?.(null, event.currentTarget))
            }
          >
            <div className="edot" style={{ background: "#8a7a6a" }} />
            <span className="en">All Exporters</span>
            <span className="ec">20</span>
          </Button>
        </div>
        <div className="sb-body" id="exp-list" />
        <div className="sb-footer">
          <div className="sb-status" id="sb-status" />
        </div>
      </div>
      <div className="exp-sidebar-rail" id="exp-sidebar-rail" hidden>
        <Button
          type="button"
          variant="legacy"
          size="legacy"
          className="sb-sidebar-toggle"
          id="exp-sidebar-toggle"
          aria-expanded="true"
          title="Hide exporters list"
          onClick={() =>
            callLegacy((win) => win.toggleExpPortfolioSidebar?.())
          }
        >
          ⟨
        </Button>
      </div>
    </>
  );
}
