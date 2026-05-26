"use client";

import { Bell, LogOut, Search } from "lucide-react";
import { AuthSession } from "@/components/auth/auth-model";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { callLegacy } from "./legacy-actions";

export function TopBar({
  session,
  onLogout,
}: {
  session: AuthSession;
  onLogout: () => void;
}) {
  return (
    <div className="qat">
      <div className="qat-title" id="qat-title">
        {session.dashboardTitle}
      </div>
      <div className="qat-search">
        <Search
          className="qat-search-icon"
          width={12}
          height={12}
          stroke="#9a8a7a"
          strokeWidth={2}
          aria-hidden="true"
        />
        <Input
          id="qat-search-input"
          placeholder="Search UID, grade, exporter…"
          onInput={(event) =>
            callLegacy((win) => win.handleSearch?.(event.currentTarget.value))
          }
        />
      </div>
      <div className="qat-right">
        <Button
          type="button"
          variant="legacy"
          size="legacy"
          className="qat-icon-btn"
          id="bell-btn"
          title="Notifications"
          onClick={() => callLegacy((win) => win.toggleNotif?.())}
        >
          <Bell width={14} height={14} strokeWidth={2} aria-hidden="true" />
          <div className="notif-badge" id="bell-badge">
            5
          </div>
        </Button>
        <Button
          type="button"
          variant="legacy"
          size="legacy"
          className="qat-avatar"
          title="Account"
          onClick={() => callLegacy((win) => win.openBackstage?.("account"))}
        >
          {session.initials}
        </Button>
        <div className="qat-role-hint" title={session.taskHint}>
          {session.roleLabel}
        </div>
        <Button
          type="button"
          variant="legacy"
          size="legacy"
          className="qat-icon-btn"
          title="Logout"
          onClick={onLogout}
        >
          <LogOut width={14} height={14} strokeWidth={2} aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
