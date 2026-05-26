# ANKUARU Bank Module Design

## 1. High-Level Design

The Bank Module gives licensed banks a secure operating console for onboarding clients, issuing Letters of Credit (LCs), managing guarantees, monitoring exposure, approving settlement events, and producing audit-ready regulatory reports. It sits beside ANKUARU's trading, market, warehouse, settlement, and blockchain services.

### Target Architecture

- Frontend: React/Next.js dashboards with role-based navigation and task queues.
- API layer: Node.js/NestJS bank services behind an API gateway.
- Identity: Keycloak realms/clients with RBAC and MFA policies.
- Data: PostgreSQL for transactional records, Redis for short-lived workflow/cache state.
- Events: Kafka topics for LC issuance, guarantee updates, trade state, risk alerts, settlement confirmations, and audit events.
- Blockchain: Permissioned anchoring for LC issuance, guarantee linkage, contract activation, delivery confirmation, and settlement release.
- Integrations: Bank core banking APIs, SWIFT/payment rails, national KYC sources, and regulator reporting interfaces.

### Core Bounded Contexts

- Bank Registry: bank profile, branch network, API credentials, supported products and commodities.
- Bank IAM: bank users, role assignment, permission grants, client account ownership.
- Client Onboarding: KYC, EDD, documents, risk scoring, limits, approval workflow.
- Guarantees: LC, performance bond, blocked funds, lifecycle events, PDF artifacts, contract linkage.
- Risk Controls: exposure aggregation, pre-trade checks, concentration rules, alerts, kill switches.
- Settlement Oversight: DvP status, delivery triggers, payment release approvals, settlement exceptions.
- Reporting and Audit: staff action logs, utilization reports, exposure reports, compliance exports.

## 2. User Stories

### Super Admin

- As a Super Admin, I can register a bank with legal name, license, documents, branches, supported commodities, currencies, and contact details.
- As a Super Admin, I can create the first Bank Admin for a bank.
- As a Super Admin, I can generate, rotate, suspend, and audit API credentials for a bank integration.
- As a Super Admin, I can suspend a bank if its license, compliance status, or integration security is compromised.

### Bank Admin

- As a Bank Admin, I can manage my bank profile, branches, supported products, currencies, and integration settings.
- As a Bank Admin, I can create internal bank users and assign roles such as Onboarder, Verifier, Risk Officer, and Viewer.
- As a Bank Admin, I can create and manage buyer/seller client accounts owned by my bank.
- As a Bank Admin, I can view audit logs for every staff action inside my bank.

### Bank Onboarder / Relationship Manager

- As an Onboarder, I can create a client profile and collect KYC/EDD documents.
- As an Onboarder, I can submit a client for verification and respond to document information requests.
- As an Onboarder, I can view clients I manage and their onboarding status.

### Bank Verifier / Credit Officer

- As a Verifier, I can review pending client KYC and LC requests.
- As a Verifier, I can approve, reject, or request more information for LC/guarantee applications.
- As a Verifier, I can issue a digital LC and link it to a specific ANKUARU contract.
- As a Verifier, I can generate a signed LC PDF and anchor issuance on the permissioned blockchain.

### Bank Risk / Compliance Officer

- As a Risk Officer, I can set client limits by daily value, per-trade value, commodity, and total exposure.
- As a Risk Officer, I can monitor bank exposure by client, commodity, contract, and guarantee type.
- As a Risk Officer, I can trigger emergency actions: suspend client, cancel bank-backed orders, freeze settlements, or block guarantee utilization.
- As a Compliance Officer, I can review risk alerts, sanctions/PEP flags, EDD findings, and audit trails.

### Bank Viewer / Auditor

- As a Viewer, I can access read-only dashboards, reports, guarantee states, settlement states, and audit logs.
- As an Auditor, I can export LC utilization, client exposure, trade settlement, and staff action reports.

### Client Buyer / Seller

- As a Buyer, I can request an LC or blocked-funds guarantee for a specific trade.
- As a Seller, I can view the guarantee backing a buyer's order before accepting trade risk.
- As a Client, I can view my limits, guarantee status, and settlement status.

## 3. Database Schema

### Key Entities

#### banks

- id (uuid, pk)
- legal_name
- display_name
- license_number
- regulator_status
- country
- data_residency_region
- logo_url
- status (draft, active, suspended)
- created_by_super_admin_id
- created_at, updated_at

#### bank_documents

- id (uuid, pk)
- bank_id (fk banks)
- document_type (license, incorporation, tax, board_resolution, api_security)
- file_url
- checksum
- verified_by
- verified_at
- status

#### bank_branches

- id (uuid, pk)
- bank_id (fk banks)
- name
- city
- address
- contact_email
- contact_phone
- status

#### bank_api_credentials

- id (uuid, pk)
- bank_id (fk banks)
- client_id
- secret_hash
- scopes
- environment (sandbox, production)
- status
- last_rotated_at
- expires_at

#### bank_users

- id (uuid, pk)
- bank_id (fk banks)
- keycloak_user_id
- full_name
- email
- phone
- status
- mfa_enabled
- created_at

#### bank_roles

- id (uuid, pk)
- code (BANK_ADMIN, BANK_ONBOARDER, BANK_VERIFIER, BANK_RISK, BANK_VIEWER)
- name
- description

#### bank_user_roles

- user_id (fk bank_users)
- role_id (fk bank_roles)
- branch_id (nullable fk bank_branches)
- assigned_by
- assigned_at

#### clients

- id (uuid, pk)
- owning_bank_id (fk banks)
- client_type (buyer, seller, both)
- legal_name
- trade_name
- registration_number
- tax_id
- country
- status (draft, kyc_pending, active, suspended, rejected)
- risk_rating (low, medium, high)
- relationship_manager_id (fk bank_users)
- created_at, updated_at

#### client_kyc_cases

- id (uuid, pk)
- client_id (fk clients)
- case_type (initial, periodic_review, enhanced_due_diligence)
- status (draft, submitted, more_info, approved, rejected)
- risk_score
- sanctions_result
- pep_result
- reviewer_id
- decision_reason
- submitted_at, decided_at

#### client_documents

- id (uuid, pk)
- client_id (fk clients)
- kyc_case_id (fk client_kyc_cases)
- document_type
- file_url
- checksum
- status

#### client_limits

- id (uuid, pk)
- client_id (fk clients)
- commodity_code
- currency
- daily_limit
- per_trade_limit
- total_exposure_limit
- tenor_limit_days
- active_from
- active_to
- approved_by

#### guarantee_requests

- id (uuid, pk)
- bank_id (fk banks)
- client_id (fk clients)
- contract_id (ANKUARU contract uid)
- requested_by_user_id
- guarantee_type (sight_lc, usance_lc, performance_bond, blocked_funds)
- amount
- currency
- tenor_days
- collateral_summary
- status (submitted, under_review, more_info, approved, rejected, issued)
- created_at, updated_at

#### guarantees

- id (uuid, pk)
- request_id (fk guarantee_requests)
- bank_id (fk banks)
- client_id (fk clients)
- contract_id
- guarantee_number
- guarantee_type
- amount
- currency
- utilized_amount
- status (issued, partially_utilized, fully_utilized, expired, released, cancelled)
- issue_date
- expiry_date
- pdf_url
- blockchain_tx_hash
- created_at, updated_at

#### guarantee_events

- id (uuid, pk)
- guarantee_id (fk guarantees)
- event_type (issued, linked, utilized, expired, released, cancelled)
- payload_json
- actor_user_id
- blockchain_tx_hash
- created_at

#### bank_exposures

- id (uuid, pk)
- bank_id
- client_id
- commodity_code
- guarantee_id
- exposure_amount
- currency
- exposure_type
- as_of_time

#### risk_rules

- id (uuid, pk)
- bank_id
- rule_type (limit, concentration, tenor, commodity, country, client_rating)
- rule_config_json
- severity
- active
- created_by

#### risk_alerts

- id (uuid, pk)
- bank_id
- client_id
- contract_id
- alert_type
- severity
- message
- status (open, acknowledged, resolved)
- assigned_to
- created_at, resolved_at

#### emergency_actions

- id (uuid, pk)
- bank_id
- client_id
- action_type (suspend_client, cancel_orders, freeze_settlement, block_guarantee)
- reason
- status
- initiated_by
- approved_by
- created_at

#### settlement_reviews

- id (uuid, pk)
- bank_id
- guarantee_id
- contract_id
- delivery_event_id
- dvp_status
- payment_release_status
- reviewed_by
- decision
- decision_reason
- created_at, decided_at

#### audit_logs

- id (uuid, pk)
- actor_user_id
- bank_id
- actor_role
- action
- resource_type
- resource_id
- before_json
- after_json
- ip_address
- user_agent
- correlation_id
- created_at

### Relationships

- One bank has many branches, users, clients, guarantees, risk rules, alerts, and reports.
- One client belongs to one owning bank but may trade with many counterparties.
- One guarantee request produces zero or one issued guarantee.
- One guarantee links to one ANKUARU contract but can have many lifecycle events.
- Risk exposure is derived from guarantees, orders, trades, and settlements.
- Every mutating action writes an audit log and emits a Kafka event.

## 4. API Endpoints

### Super Admin / Bank Registry

- POST /api/banks
- GET /api/banks
- GET /api/banks/{bankId}
- PATCH /api/banks/{bankId}
- POST /api/banks/{bankId}/documents
- POST /api/banks/{bankId}/admin-users
- POST /api/banks/{bankId}/api-credentials
- POST /api/banks/{bankId}/api-credentials/{credentialId}/rotate
- POST /api/banks/{bankId}/suspend

### Bank Users and RBAC

- GET /api/banks/{bankId}/users
- POST /api/banks/{bankId}/users
- PATCH /api/banks/{bankId}/users/{userId}
- POST /api/banks/{bankId}/users/{userId}/roles
- DELETE /api/banks/{bankId}/users/{userId}/roles/{roleId}
- GET /api/permissions/me

### Client Management

- GET /api/banks/{bankId}/clients
- POST /api/banks/{bankId}/clients
- GET /api/banks/{bankId}/clients/{clientId}
- PATCH /api/banks/{bankId}/clients/{clientId}
- POST /api/banks/{bankId}/clients/{clientId}/kyc-cases
- POST /api/banks/{bankId}/clients/{clientId}/documents
- POST /api/banks/{bankId}/clients/{clientId}/submit-kyc
- POST /api/banks/{bankId}/clients/{clientId}/approve-kyc
- POST /api/banks/{bankId}/clients/{clientId}/reject-kyc
- POST /api/banks/{bankId}/clients/{clientId}/limits

### LC and Guarantee Management

- GET /api/banks/{bankId}/guarantee-requests
- POST /api/banks/{bankId}/guarantee-requests
- GET /api/banks/{bankId}/guarantee-requests/{requestId}
- POST /api/banks/{bankId}/guarantee-requests/{requestId}/review
- POST /api/banks/{bankId}/guarantee-requests/{requestId}/request-info
- POST /api/banks/{bankId}/guarantee-requests/{requestId}/approve
- POST /api/banks/{bankId}/guarantee-requests/{requestId}/reject
- POST /api/banks/{bankId}/guarantee-requests/{requestId}/issue
- GET /api/banks/{bankId}/guarantees
- GET /api/banks/{bankId}/guarantees/{guaranteeId}
- POST /api/banks/{bankId}/guarantees/{guaranteeId}/link-contract
- POST /api/banks/{bankId}/guarantees/{guaranteeId}/release
- POST /api/banks/{bankId}/guarantees/{guaranteeId}/cancel
- GET /api/banks/{bankId}/guarantees/{guaranteeId}/pdf

### Risk and Settlement

- GET /api/banks/{bankId}/risk/exposure
- GET /api/banks/{bankId}/risk/alerts
- POST /api/banks/{bankId}/risk/rules
- PATCH /api/banks/{bankId}/risk/rules/{ruleId}
- POST /api/banks/{bankId}/risk/alerts/{alertId}/acknowledge
- POST /api/banks/{bankId}/emergency-actions
- GET /api/banks/{bankId}/settlement-reviews
- POST /api/banks/{bankId}/settlement-reviews/{reviewId}/approve-release
- POST /api/banks/{bankId}/settlement-reviews/{reviewId}/hold

### Reporting and Audit

- GET /api/banks/{bankId}/reports/lc-utilization
- GET /api/banks/{bankId}/reports/client-exposure
- GET /api/banks/{bankId}/reports/trade-settlement
- GET /api/banks/{bankId}/reports/risk-compliance
- GET /api/banks/{bankId}/audit-logs

## 5. Role-Permission Matrix

| Permission | Super Admin | Bank Admin | Onboarder | Verifier | Risk/Compliance | Viewer/Auditor |
| --- | --- | --- | --- | --- | --- | --- |
| Register bank | Yes | No | No | No | No | No |
| Manage bank profile | Yes | Yes | No | No | Read | Read |
| Manage API credentials | Yes | Yes | No | No | Read | Read |
| Manage bank users | No | Yes | No | No | No | Read |
| Create client | No | Yes | Yes | No | No | Read |
| Submit KYC | No | Yes | Yes | No | No | Read |
| Approve KYC | No | Yes | No | Yes | Yes | Read |
| Set client limits | No | Yes | No | Yes | Yes | Read |
| Review LC request | No | Yes | No | Yes | Read | Read |
| Issue LC/Guarantee | No | Yes | No | Yes | No | Read |
| Configure risk rules | No | Yes | No | No | Yes | Read |
| Emergency actions | No | Yes | No | No | Yes | Read |
| Release settlement | No | Yes | No | Yes | Yes | Read |
| Export reports | Yes | Yes | No | Limited | Yes | Yes |
| View audit trail | Yes | Yes | No | Own actions | Yes | Yes |

## 6. Main Workflows

### Bank Registration

1. Super Admin creates bank draft.
2. Upload license and legal documents.
3. Create first Bank Admin.
4. Configure supported commodities, currencies, branches, products, and API scopes.
5. Generate sandbox credentials.
6. Compliance approval activates bank.
7. Audit log and bank.registered event emitted.

### Client Onboarding

1. Bank Onboarder creates client profile.
2. Upload KYC and EDD documents.
3. Run sanctions, PEP, beneficial ownership, and registry checks.
4. Submit case to Verifier/Risk Officer.
5. Verifier approves/rejects/requests more information.
6. Risk Officer sets limits and risk rating.
7. Client account becomes active for trading.
8. client.kyc.approved event emitted and anchored if required.

### LC / Guarantee Issuance

1. Buyer requests LC against an ANKUARU contract or intended trade.
2. System validates client status, limits, collateral, exposure, and contract details.
3. Bank Verifier reviews request documents and credit position.
4. Verifier approves, rejects, or requests more information.
5. On approval, bank issues digital LC/guarantee and generates PDF.
6. LC is linked to contract; blockchain anchor records issuance and link.
7. Contract becomes eligible for activation/trading/settlement.
8. Guarantee lifecycle is tracked until release, expiry, cancellation, or full utilization.

### Pre-Trade Risk Check

1. Client submits order or trade intent.
2. Trading service requests bank risk decision.
3. Bank service checks client limits, commodity concentration, active exposure, tenor, sanctions state, and emergency flags.
4. Decision returns approve/decline/manual-review.
5. Result is logged and emitted as risk.pretrade.checked.

### Settlement Release

1. Warehouse/delivery confirmation arrives.
2. DvP engine checks delivery, documents, LC terms, utilization state, and settlement rail readiness.
3. Bank Verifier/Risk Officer reviews payment release task.
4. Approve release or hold for exception.
5. Settlement event updates guarantee utilization and contract state.
6. Audit log and blockchain anchor are recorded.

### Emergency Action

1. Risk Officer opens emergency action.
2. System prompts reason, scope, affected clients/contracts/orders, and approval rule.
3. Bank Admin or second officer approves if dual control is required.
4. Action propagates to trading, settlement, and guarantee services through Kafka.
5. All affected orders/settlements are frozen or cancelled.

## 7. UI / Dashboard Screens

### Unified Login

- Single login page for all roles.
- Username/email and password.
- MFA step for OTP/authenticator.
- Remember me, forgot password, show/hide password.
- Demo role selector in development.
- English and Amharic labels.
- Redirects to role dashboard after authentication.

### Super Admin Dashboard

- Bank registry metrics.
- Pending bank approvals.
- API credential health.
- Compliance queue.
- Audit activity and system risk alerts.

### Bank Admin Dashboard

- Bank profile summary.
- User and role management.
- Client portfolio.
- LC/guarantee value issued.
- Active exposure, pending approvals, settled trades.
- Quick task queue for LC approvals, KYC reviews, risk alerts.

### Bank Onboarder Dashboard

- Client onboarding pipeline.
- Draft KYC cases.
- More-information requests.
- Client document status.
- Relationship manager task list.

### Bank Verifier Dashboard

- Pending LC requests.
- Pending KYC approvals.
- Credit review checklist.
- Collateral and limit view.
- Issue/reject/request-info actions.

### Bank Risk / Compliance Dashboard

- Exposure heatmap by client, commodity, product, and tenor.
- Risk alerts.
- Concentration rules and limit breaches.
- Emergency action panel.
- Compliance reports and audit search.

### Bank Viewer / Auditor Dashboard

- Read-only bank profile.
- LC utilization reports.
- Client exposure reports.
- Trade settlement reports.
- Audit trail export.

### Client Dashboard

- Trading marketplace.
- Orders and portfolio.
- Guarantee requests.
- Limits and bank-backed exposure.
- Settlement status.

## 8. Security and Compliance Practices

- Keycloak-backed MFA and password policies.
- Least-privilege RBAC with bank-level tenant isolation.
- Dual control for high-risk actions.
- Full audit logging with immutable event correlation IDs.
- Data residency controls for Ethiopian banking data.
- API credentials stored hashed/encrypted, rotated regularly.
- PDF documents checksummed and access-controlled.
- Blockchain anchoring stores hashes/events, not sensitive full documents.
- Kafka event payloads must avoid unnecessary PII.
