"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Moon, ShieldCheck, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AuthSession,
  demoUsers,
  findDemoUser,
  Locale,
  translations,
  UserRole,
} from "./auth-model";

type LoginPageProps = {
  onAuthenticated: (session: AuthSession) => void;
};

export function LoginPage({ onAuthenticated }: LoginPageProps) {
  const [locale, setLocale] = useState<Locale>("en");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [identifier, setIdentifier] = useState("bank.admin@abaybank.et");
  const [password, setPassword] = useState("demo-password");
  const [selectedRole, setSelectedRole] = useState<UserRole>("BANK_ADMIN");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);

  const t = translations[locale];
  const selectedUser = useMemo(
    () => findDemoUser(identifier, selectedRole),
    [identifier, selectedRole],
  );

  function authenticate(user = selectedUser) {
    if (!identifier.trim() || !password.trim()) {
      setFeedback({ kind: "error", message: t.error });
      return;
    }

    setLoading(true);
    setFeedback({ kind: "success", message: t.success });

    window.setTimeout(() => {
      onAuthenticated({
        ...user,
        authenticatedAt: new Date().toISOString(),
        mfaVerified: false,
        rememberMe,
      });
      setLoading(false);
    }, 450);
  }

  function loginAs(user: (typeof demoUsers)[number]) {
    setIdentifier(user.email);
    setSelectedRole(user.role);
    authenticate(user);
  }

  const isDark = theme === "dark";

  return (
    <main className={`login-page ${isDark ? "login-page--dark" : "login-page--light"}`}>
      <section className="login-hero" aria-label="ANKUARU login">
        <div className="login-hero__copy">
          <div className="login-brochure-top">
            <div className="login-logo-mark">A</div>
            <div>
              <p className="login-kicker">ANKUARU</p>
              <span>Institutional trade finance portal</span>
            </div>
          </div>
          <div className="login-brochure-body">
            <h1>{t.subtitle}</h1>
            <p>
              Bank-backed commodity trading with LCs, performance bonds,
              blocked funds, settlement automation, and permissioned blockchain
              anchoring.
            </p>
            <div className="login-trust-row">
              <span>LC-backed trades</span>
              <span>Granular RBAC</span>
              <span>Audit ready</span>
            </div>
          </div>
          <div className="login-brochure-grid">
            <div>
              <strong>8</strong>
              <span>role dashboards</span>
            </div>
            <div>
              <strong>24/7</strong>
              <span>risk oversight</span>
            </div>
            <div>
              <strong>ET</strong>
              <span>data residency</span>
            </div>
          </div>
        </div>

        <form
          className="login-card"
          onSubmit={(event) => {
            event.preventDefault();
            authenticate();
          }}
        >
          <div className="login-top-controls" aria-label="Login preferences">
            <div className="login-lang-toggle" aria-label={t.language}>
              <Button
                type="button"
                variant="legacy"
                size="legacy"
                className={locale === "en" ? "is-active" : ""}
                onClick={() => setLocale("en")}
              >
                EN
              </Button>
              <Button
                type="button"
                variant="legacy"
                size="legacy"
                className={locale === "am" ? "is-active" : ""}
                onClick={() => setLocale("am")}
              >
                አማ
              </Button>
            </div>
            <Button
              type="button"
              variant="legacy"
              size="legacy"
              className="login-theme-toggle"
              aria-label={t.theme}
              title={theme === "dark" ? t.light : t.dark}
              onClick={() =>
                setTheme((current) => (current === "dark" ? "light" : "dark"))
              }
            >
              {theme === "dark" ? (
                <Sun aria-hidden="true" />
              ) : (
                <Moon aria-hidden="true" />
              )}
            </Button>
          </div>

          <div className="login-card__head">
            <div>
              <p className="login-card__eyebrow">{t.subtitle}</p>
              <h2>{t.title}</h2>
            </div>
            <ShieldCheck aria-hidden="true" />
          </div>

          <label className="login-field login-field--identifier">
            <span>{t.identifier}</span>
            <Input
              value={identifier}
              autoComplete="username"
              onChange={(event) => setIdentifier(event.target.value)}
            />
          </label>

          <label className="login-field login-field--password">
            <span>{t.password}</span>
            <div className="login-password">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
              />
              <Button
                type="button"
                variant="legacy"
                size="legacy"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" />
                ) : (
                  <Eye aria-hidden="true" />
                )}
                {showPassword ? t.hide : t.show}
              </Button>
            </div>
          </label>

          <label className="login-field login-field--role">
            <span>{t.role}</span>
            <select
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value as UserRole)}
            >
              {demoUsers.map((user) => (
                <option key={user.role} value={user.role}>
                  {user.roleLabel}
                </option>
              ))}
            </select>
          </label>

          <div className="login-options">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              {t.remember}
            </label>
            <button type="button">{t.forgot}</button>
          </div>

          {feedback ? (
            <div className={`login-feedback login-feedback--${feedback.kind}`}>
              {feedback.message}
            </div>
          ) : null}

          <div className="login-actions">
            <Button type="submit" className="login-submit" disabled={loading}>
              {loading ? t.verifying : t.signIn}
            </Button>

            <Button type="button" variant="outline" className="login-sso" disabled>
              {t.sso}
            </Button>
          </div>

          <details className="login-demo" open>
            <summary className="login-demo__title">{t.demoAccess}</summary>
            <div className="login-demo__grid">
              {demoUsers.slice(0, 6).map((user) => (
                <Button
                  key={user.id}
                  type="button"
                  variant="legacy"
                  size="legacy"
                  onClick={() => loginAs(user)}
                >
                  {user.roleLabel}
                </Button>
              ))}
            </div>
          </details>
        </form>
      </section>
    </main>
  );
}
