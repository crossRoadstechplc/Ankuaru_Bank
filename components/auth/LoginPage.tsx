"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Eye, EyeOff, Moon, ShieldCheck, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AuthSession,
  demoUsers,
  Locale,
  translations,
  UserRole,
  type DemoUser,
} from "./auth-model";
import { findLoginUser, listPlatformUsers, PLATFORM_USERS_UPDATED_EVENT } from "@/lib/platform-users-db";

type LoginPageProps = {
  onAuthenticated: (session: AuthSession) => void;
};

type LoginRoleSelectProps = {
  value: UserRole;
  options: { value: UserRole; label: string }[];
  onChange: (value: UserRole) => void;
};

function LoginRoleSelect({ value, options, onChange }: LoginRoleSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? value;

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="login-select" ref={rootRef}>
      <button
        type="button"
        className="login-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby="login-role-label"
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selectedLabel}</span>
        <ChevronDown aria-hidden="true" />
      </button>
      {open ? (
        <ul className="login-select__menu" role="listbox" aria-label="Role">
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={option.value === value ? "is-selected" : ""}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

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

  const [loginTick, setLoginTick] = useState(0);

  useEffect(() => {
    function refresh() {
      setLoginTick((current) => current + 1);
    }
    window.addEventListener(PLATFORM_USERS_UPDATED_EVENT, refresh);
    return () =>
      window.removeEventListener(PLATFORM_USERS_UPDATED_EVENT, refresh);
  }, []);

  const t = translations[locale];
  const loginUsers = useMemo(() => {
    void loginTick;
    const users = listPlatformUsers();
    return users.length
      ? users.filter((user) => user.status === "active").map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          roleLabel: user.roleLabel,
          bankName: user.bankName,
          initials: user.initials,
          dashboardTitle: user.dashboardTitle,
          dashboardSubtitle: user.dashboardSubtitle,
          welcome: user.welcome,
          defaultSection: user.defaultSection,
          taskHint: user.taskHint,
        }))
      : demoUsers;
  }, [loginTick]);

  const selectedUser = useMemo(
    () =>
      findLoginUser(identifier, selectedRole) ??
      loginUsers.find((user) => user.role === selectedRole) ??
      loginUsers[0],
    [identifier, selectedRole, loginUsers],
  );

  function authenticate(user = selectedUser) {
    if (!identifier.trim() || !password.trim()) {
      setFeedback({ kind: "error", message: t.error });
      return;
    }
    if (!user) {
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

  function loginAs(user: DemoUser) {
    setIdentifier(user.email);
    setSelectedRole(user.role);
    authenticate(user);
  }

  const isDark = theme === "dark";

  return (
    <main
      className={`login-page ${isDark ? "login-page--dark" : "login-page--light"}`}
    >
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
              Bank-backed commodity trading with LCs, performance bonds, blocked
              funds, settlement automation, and permissioned blockchain
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
              <strong>6</strong>
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
                {/* {showPassword ? t.hide : t.show} */}
              </Button>
            </div>
          </label>

          <div className="login-field login-field--role">
            <span id="login-role-label">{t.role}</span>
            <LoginRoleSelect
              value={selectedRole}
              options={loginUsers.map((user) => ({
                value: user.role,
                label: user.roleLabel,
              }))}
              onChange={setSelectedRole}
            />
          </div>

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

            <Button
              type="button"
              variant="outline"
              className="login-sso"
              disabled
            >
              {t.sso}
            </Button>
          </div>

          <details className="login-demo" open>
            <summary className="login-demo__title">{t.demoAccess}</summary>
            <div className="login-demo__grid">
              {loginUsers.map((user) => (
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
