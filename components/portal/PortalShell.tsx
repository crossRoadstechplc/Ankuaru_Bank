"use client";

import { useCallback } from "react";
import { AuthSession } from "@/components/auth/auth-model";
import { Button } from "@/components/ui/button";
import { ImporterSidebar } from "./ImporterSidebar";
import { LegacyScriptLoader } from "./LegacyScriptLoader";
import { Overlays } from "./Overlays";
import { PortfolioWorkspace } from "./PortfolioWorkspace";
import { Ribbon } from "./Ribbon";
import { StatusBar } from "./StatusBar";
import { TopBar } from "./TopBar";
import { callLegacy } from "./legacy-actions";

export function PortalShell({
  scriptSource,
  session,
  onLogout,
}: {
  scriptSource: string;
  session: AuthSession;
  onLogout: () => void;
}) {
  const applyRoleContext = useCallback(() => {
    const title = document.getElementById("qat-title");
    const crumb = document.getElementById("sb-crumb");
    const welcome = document.querySelector<HTMLElement>(".portfolio-welcome-text");

    if (title) title.textContent = session.dashboardTitle;
    if (crumb) {
      crumb.textContent = `Ankuaru · ${session.bankName ?? "Platform"} · ${
        session.roleLabel
      }`;
    }
    if (welcome) {
      welcome.textContent = `${session.welcome} · ${session.dashboardTitle}`;
    }

    window.setTimeout(() => {
      const button = document.getElementById(
        `bsn-${session.defaultSection}`,
      ) as HTMLButtonElement | null;

      if (session.defaultSection === "auction" && button) {
        callLegacy((win) => win.openAuctionFromSidebar?.(button));
        return;
      }

      if (button) {
        callLegacy((win) =>
          win.showBsSection?.(session.defaultSection, button),
        );
      }
    }, 0);
  }, [session]);

  return (
    <>
      <div className="portal-root">
        <div className="backstage backstage--docked open" id="backstage">
          <ImporterSidebar session={session} />
          <div className="bs-content" id="bs-content">
            <div id="portfolio-dock" className="portfolio-dock">
              <TopBar session={session} onLogout={onLogout} />
              <Ribbon />
              <PortfolioWorkspace session={session} />
            </div>
            <div id="bs-dynamic" className="bs-dynamic" hidden />
          </div>
        </div>
      </div>
      <StatusBar session={session} />
      <Overlays />
      <Button
        type="button"
        id="bs-rail-expand"
        variant="legacy"
        size="legacy"
        className="bs-rail-expand"
        hidden
        aria-label="Show importer navigation"
        onClick={() => callLegacy((win) => win.toggleBsImporterNav?.())}
      >
        »
      </Button>
      <LegacyScriptLoader scriptSource={scriptSource} onReady={applyRoleContext} />
    </>
  );
}
