"use client";

import { Button } from "@/components/ui/button";
import { callLegacy } from "./legacy-actions";

const tabs = [
  { id: "home", label: "Home", className: "rtab active" },
  {
    id: "contracts",
    label: "Contracts",
    className: "rtab ctx-tab",
    style: { display: "none" },
  },
  {
    id: "trace",
    label: "Trace",
    className: "rtab ctx-tab",
    style: { display: "none" },
  },
  {
    id: "quality",
    label: "Quality",
    className: "rtab ctx-tab",
    style: { display: "none" },
  },
  { id: "actors", label: "Actors", className: "rtab" },
  { id: "compliance", label: "Compliance", className: "rtab" },
  { id: "reports", label: "Reports", className: "rtab" },
] as const;

export function Ribbon() {
  return (
    <div className="ribbon" id="ribbon">
      <div className="ctx-strip" id="ctx-strip">
        <div className="ctx-strip-inner" id="ctx-strip-inner" />
      </div>
      <div className="rtabs" id="rtabs">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            variant="legacy"
            size="legacy"
            className={tab.className}
            id={`tab-${tab.id}`}
            style={"style" in tab ? tab.style : undefined}
            onClick={(event) =>
              callLegacy((win) =>
                win.switchRTab?.(tab.id, event.currentTarget),
              )
            }
          >
            {tab.label}
          </Button>
        ))}
      </div>
      <div className="rbody" id="rbody" />
    </div>
  );
}
