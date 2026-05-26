"use client";

import { AuthSession } from "@/components/auth/auth-model";
import { callLegacy } from "./legacy-actions";

export function StatusBar({ session }: { session: AuthSession }) {
  return (
    <>
      <div className="statusbar">
        <div className="sb-crumb" id="sb-crumb">
          Ankuaru · {session.bankName ?? "Platform"} · {session.roleLabel}
        </div>
        <div className="sb-items" id="sb-items" />
        <div
          id="sb-market"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginRight: 12,
            fontSize: 10,
            color: "#7a88a0",
            fontFamily: "'SF Mono',Menlo,monospace",
            cursor: "pointer",
          }}
          onClick={() => callLegacy((win) => win.openBackstage?.("risk"))}
          title="Open Risk Command Center"
        >
          <span>
            NY-C <b style={{ color: "#c4e0d8" }}>378.25¢</b>
          </span>
          <span>
            ETB <b style={{ color: "#c4e0d8" }}>156.00</b>
          </span>
          <span id="sb-alert-chip" style={{ color: "#e8c060" }} />
        </div>
        <div className="sb-right">
          <span id="sb-date" />
          <span style={{ color: "#3a2a1a" }}>|</span>
          <span>{session.role}</span>
        </div>
      </div>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#1a1208",
          color: "#9a8a7a",
          fontSize: 9,
          padding: "3px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid #2e2010",
          zIndex: 50,
          letterSpacing: ".04em",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            aria-hidden="true"
            style={{
              width: 11,
              height: 11,
              borderRadius: "50%",
              display: "inline-grid",
              placeItems: "center",
              background: "#d4820a",
              color: "#1a1208",
              fontSize: 7,
              fontWeight: 800,
            }}
          >
            A
          </span>
          ANKUARU · TRACK & TRADE
        </div>
        <div>© 2026 Ankuaru. All rights reserved. · Built on CHAINROOT</div>
      </div>
    </>
  );
}
