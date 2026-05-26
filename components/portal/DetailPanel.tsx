"use client";

import { Button } from "@/components/ui/button";
import { callLegacy } from "./legacy-actions";

const detailTabs = [
  { id: "overview", label: "Overview", active: true },
  { id: "lc", label: "LC & Contract" },
  { id: "trace", label: "Trace" },
  { id: "quality", label: "Quality" },
  { id: "origin", label: "Origin" },
] as const;

export function DetailPanel() {
  return (
    <div className="detail" id="detail">
      <div className="di">
        <div className="dh">
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            className="d-close"
            onClick={() => callLegacy((win) => win.closeDetail?.())}
          >
            ✕
          </Button>
          <div id="d-uid-chip" />
          <div className="d-grade" id="d-grade" />
          <div className="d-sub" id="d-sub" />
        </div>
        <div className="stepper" id="d-stepper" />
        <div className="dtabs" id="d-tabs">
          {detailTabs.map((tab) => (
            <div
              key={tab.id}
              className={`dtab${"active" in tab && tab.active ? " active" : ""}`}
              onClick={(event) =>
                callLegacy((win) =>
                  win.switchDTab?.(tab.id, event.currentTarget),
                )
              }
            >
              {tab.label}
            </div>
          ))}
        </div>
        <div className="dtbody" id="dtbody" />
      </div>
    </div>
  );
}
