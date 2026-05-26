"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal/PortalShell";
import { AuthSession } from "./auth-model";
import { LoginPage } from "./LoginPage";

const SESSION_KEY = "ankuaru.demo.session";

export function AuthenticatedApp({ scriptSource }: { scriptSource: string }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw =
      window.localStorage.getItem(SESSION_KEY) ??
      window.sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        setSession(JSON.parse(raw) as AuthSession);
      } catch {
        window.localStorage.removeItem(SESSION_KEY);
      }
    }
    setReady(true);
  }, []);

  function handleAuthenticated(nextSession: AuthSession) {
    setSession(nextSession);
    if (nextSession.rememberMe) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    } else {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    }
  }

  function handleLogout() {
    window.localStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
  }

  if (!ready) return null;

  if (!session) {
    return <LoginPage onAuthenticated={handleAuthenticated} />;
  }

  return (
    <PortalShell
      scriptSource={scriptSource}
      session={session}
      onLogout={handleLogout}
    />
  );
}
