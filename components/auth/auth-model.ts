export type Locale = "en" | "am";

export type UserRole =
  | "SUPER_ADMIN"
  | "BANK_ADMIN"
  | "BANK_ONBOARDER"
  | "BANK_VERIFIER"
  | "BANK_RISK"
  | "CLIENT"
  | "WAREHOUSE_OPERATOR"
  | "REGULATOR";

export type DemoUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  bankName?: string;
  initials: string;
  dashboardTitle: string;
  dashboardSubtitle: string;
  welcome: string;
  defaultSection: string;
  taskHint: string;
};

export type AuthSession = DemoUser & {
  authenticatedAt: string;
  mfaVerified: boolean;
  rememberMe: boolean;
};

export const roleDestinations: Record<UserRole, string> = {
  SUPER_ADMIN: "Global System Dashboard",
  BANK_ADMIN: "Bank Management Dashboard",
  BANK_ONBOARDER: "Client Onboarding Dashboard",
  BANK_VERIFIER: "LC Approval & Verification Dashboard",
  BANK_RISK: "Risk & Compliance Dashboard",
  CLIENT: "Trading Dashboard",
  WAREHOUSE_OPERATOR: "Warehouse Operations Dashboard",
  REGULATOR: "Regulator Read-Only Dashboard",
};

export const demoUsers: DemoUser[] = [
  {
    id: "usr-super-admin",
    name: "Ankuaru Super Admin",
    email: "admin@ankuaru.com",
    role: "SUPER_ADMIN",
    roleLabel: "Ankuaru Super Admin",
    initials: "SA",
    dashboardTitle: "Global System Dashboard",
    dashboardSubtitle: "Banks, markets, platform risk, and network operations.",
    welcome: "Welcome back, Super Admin",
    defaultSection: "risk",
    taskHint: "Review bank approvals, API credential health, and system risk.",
  },
  {
    id: "usr-bank-admin",
    name: "Mekdes Alemu",
    email: "bank.admin@abaybank.et",
    role: "BANK_ADMIN",
    roleLabel: "Bank Admin",
    bankName: "Abay Bank",
    initials: "MA",
    dashboardTitle: "Bank Management Dashboard",
    dashboardSubtitle: "Users, clients, guarantees, exposure, and settlement tasks.",
    welcome: "Welcome back, Bank Admin",
    defaultSection: "contracts",
    taskHint: "Manage bank users, client limits, and pending LC approvals.",
  },
  {
    id: "usr-bank-onboarder",
    name: "Daniel Tadesse",
    email: "onboarder@abaybank.et",
    role: "BANK_ONBOARDER",
    roleLabel: "Bank Onboarder / Relationship Manager",
    bankName: "Abay Bank",
    initials: "DT",
    dashboardTitle: "Client Onboarding Dashboard",
    dashboardSubtitle: "KYC cases, document collection, and client readiness.",
    welcome: "Welcome back, Bank Onboarder",
    defaultSection: "actors",
    taskHint: "Complete KYC tasks and respond to document requests.",
  },
  {
    id: "usr-bank-verifier",
    name: "Hana Bekele",
    email: "verifier@abaybank.et",
    role: "BANK_VERIFIER",
    roleLabel: "Bank Verifier / Credit Officer",
    bankName: "Abay Bank",
    initials: "HB",
    dashboardTitle: "LC Approval & Verification Dashboard",
    dashboardSubtitle: "Pending LC requests, collateral review, and issuance actions.",
    welcome: "Welcome back, Bank Verifier",
    defaultSection: "contracts",
    taskHint: "Review LC requests and issue digital guarantees.",
  },
  {
    id: "usr-bank-risk",
    name: "Solomon Tesfaye",
    email: "risk@abaybank.et",
    role: "BANK_RISK",
    roleLabel: "Bank Risk / Compliance Officer",
    bankName: "Abay Bank",
    initials: "ST",
    dashboardTitle: "Risk & Compliance Dashboard",
    dashboardSubtitle: "Exposure, limit breaches, alerts, and emergency controls.",
    welcome: "Welcome back, Risk Officer",
    defaultSection: "risk",
    taskHint: "Monitor exposure heatmaps and investigate active alerts.",
  },
  {
    id: "usr-client",
    name: "Nordic Imports B.V.",
    email: "buyer@nordic.example",
    role: "CLIENT",
    roleLabel: "Client Buyer",
    initials: "NI",
    dashboardTitle: "Trading Dashboard",
    dashboardSubtitle: "Market, portfolio, orders, and guarantee requests.",
    welcome: "Welcome back, Client",
    defaultSection: "auction",
    taskHint: "Track orders, portfolio lots, and bank-backed guarantees.",
  },
  {
    id: "usr-warehouse",
    name: "Modjo Warehouse Operator",
    email: "warehouse@ankuaru.com",
    role: "WAREHOUSE_OPERATOR",
    roleLabel: "Warehouse Operator",
    initials: "WO",
    dashboardTitle: "Warehouse Operations Dashboard",
    dashboardSubtitle: "Warehouse receipts, delivery confirmations, and custody events.",
    welcome: "Welcome back, Warehouse Operator",
    defaultSection: "inv",
    taskHint: "Confirm custody events and delivery documentation.",
  },
  {
    id: "usr-regulator",
    name: "Regulator Viewer",
    email: "regulator@ethiopia.gov.et",
    role: "REGULATOR",
    roleLabel: "Regulator (Read Only)",
    initials: "RG",
    dashboardTitle: "Regulator Read-Only Dashboard",
    dashboardSubtitle: "Audit trail, risk summaries, and market oversight reports.",
    welcome: "Welcome back, Regulator",
    defaultSection: "settlement",
    taskHint: "Review reports, audit trails, and DvP status.",
  },
];

export function findDemoUser(login: string, selectedRole?: UserRole) {
  const normalized = login.trim().toLowerCase();

  return (
    demoUsers.find((user) => user.email.toLowerCase() === normalized) ??
    demoUsers.find((user) => user.role === selectedRole) ??
    demoUsers[1]
  );
}

export const translations = {
  en: {
    title: "Sign in to ANKUARU",
    subtitle: "Commodity Trading Marketplace",
    identifier: "Email or username",
    password: "Password",
    remember: "Remember me",
    forgot: "Forgot password?",
    signIn: "Sign in",
    verifying: "Verifying...",
    show: "Show",
    hide: "Hide",
    demoAccess: "Demo access",
    role: "Role",
    language: "Language",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    sso: "Bank SSO placeholder",
    success: "Authentication successful. Routing to dashboard...",
    error: "Enter a username and password.",
  },
  am: {
    title: "ወደ ANKUARU ይግቡ",
    subtitle: "የምርት ንግድ ገበያ",
    identifier: "ኢሜይል ወይም የተጠቃሚ ስም",
    password: "የይለፍ ቃል",
    remember: "አስታውሰኝ",
    forgot: "የይለፍ ቃል ረሱ?",
    signIn: "ግባ",
    verifying: "በማረጋገጥ ላይ...",
    show: "አሳይ",
    hide: "ደብቅ",
    demoAccess: "የማሳያ መግቢያ",
    role: "ሚና",
    language: "ቋንቋ",
    theme: "ገጽታ",
    light: "ብርሃን",
    dark: "ጨለማ",
    sso: "የባንክ SSO ቦታ ያዥ",
    success: "መግቢያው ተሳክቷል። ወደ ዳሽቦርድ በመሄድ ላይ...",
    error: "የተጠቃሚ ስም እና የይለፍ ቃል ያስገቡ።",
  },
} satisfies Record<Locale, Record<string, string>>;
