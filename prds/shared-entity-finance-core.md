---
title: Shared Entity Finance Core
created: 2026-02-19
status: in-progress
owner: Tommy
log:
  - 2026-02-19: Initial requirements documented
  - 2026-02-19: Scope updated to entity model (household + business), role-based sharing, recurring ledger flows, and Plaid automation
  - 2026-02-19: Added document upload roadmap and super_admin AWS storage/distribution setup requirements
  - 2026-02-19: Added Auth.js-only auth requirement and financial security architecture constraints
  - 2026-02-19: Implemented MVP scaffold (Auth.js auth, entity routes, invites, ledger transactions, document upload, and super_admin storage setup)
  - 2026-03-03: Hardened auth architecture with Convex custom JWT actor binding, wrapper-based public function authorization, and super_admin enforcement in Convex storage paths
  - 2026-03-03: Standardized post-submit UX to redirect successful mutations with route-level success toasts and visible state transitions
---

## Problem
Most personal budgeting tools optimize for one user with optional partner access, while business accounting tools optimize for bookkeeping depth over collaborative day-to-day cash visibility. Teams that need shared control across household and business finances lack a unified, role-aware workspace for planning and transaction execution.

## Business Context
Our Ledger will shift from a household-only concept to an entity-based financial operating system. Users can create either a household or business entity, invite collaborators, and manage all income/expense flows with shared visibility.

The product is opinionated toward transparent collaboration and practical execution:

- Entity ownership and access are explicit.
- Every financial record belongs to a specific entity.
- Recurring and one-off flows are first-class.
- Bank-linked automation via Plaid reduces manual effort.

### Competitive Research Snapshot (as of 2026-02-19)
Leading consumer budgeting products reinforce high demand for simple collaboration, recurring spend awareness, and automated transaction ingestion.

- YNAB: shared budgeting discipline, category planning, and sync habits. Source: [YNAB Features](https://www.ynab.com/features), [YNAB Together](https://www.ynab.com/ynab-together)
- Monarch Money: household collaboration, account aggregation, and planning dashboards. Source: [Monarch Features](https://www.monarchmoney.com/features), [Monarch Couples](https://www.monarchmoney.com/couples)
- Rocket Money: recurring bill/subscription visibility and savings-oriented automation. Source: [Rocket Money Features](https://www.rocketmoney.com/features)
- Quicken Simplifi: spend planning and proactive cash monitoring. Source: [Quicken Simplifi](https://www.quicken.com/products/simplifi/)

These patterns inform Our Ledger’s shared-entity roadmap while extending scope to business entities and role-based collaboration.

## Goals & KPIs
Primary goals:

- Enable users to create and operate shared `household` and `business` entities.
- Make role-based collaboration explicit with ownership and invite flows.
- Support complete entity-level ledgers for one-off and recurring income/expenses.
- Automate transaction ingestion and reconciliation with Plaid.
- Support entity-scoped document uploads for receipts, invoices, and contracts.
- Enforce financial-grade security controls with Auth.js (NextAuth.js) and server-side authorization.

KPIs (first 6 months post-beta):

- 80%+ of activated users create at least one entity within first session.
- 60%+ of entities invite and onboard at least one additional collaborator.
- 70%+ of active entities record both one-off and recurring items.
- 65%+ of active entities link at least one financial account via Plaid.
- 50%+ of imported Plaid transactions auto-categorized without manual edits.
- 55%+ of active entities upload at least one supporting document each month.
- 0 critical auth/authorization findings open at public launch security review.

## Personas/Journeys
Primary personas:

- Household owner managing shared personal finances.
- Business owner tracking operational income/expenses with collaborators.
- Invited collaborator (owner or user) who needs transparent, scoped access.
- Platform super admin configuring storage and delivery infrastructure.

Core journeys:

1. Create entity
   - User creates a `household` or `business` with required profile fields (name, address, timezone, currency).
2. Invite collaborator
   - Owner invites another user as `owner` or `user`; invitee accepts and joins entity.
3. Capture transactions
   - Members add one-off income/expense entries manually.
4. Configure recurring flows
   - Members define recurring schedules for bills, payroll, rent, retainers, etc.
5. Connect Plaid
   - Owner links a bank account and imported transactions feed automation and reconciliation.
6. Manage entity documents
   - Members upload and attach documents (receipts/contracts) to ledger items for shared reference.
7. Configure storage infrastructure
   - Super admin sets up S3 + CloudFront for uploads and secure document delivery.

## Functional Requirements
MVP (Phase 1):

### Entity Management
- Create entity with type enum: `household` or `business`.
- Entity profile fields: name, address, timezone, currency, optional description.
- Entity switcher for users with membership in multiple entities.
- Owner-only controls for updating entity profile and archiving entity.

### Roles, Membership, and Invites
- Roles: `owner`, `user`.
- Invitation flow: send by email with target role.
- Invite lifecycle: pending, accepted, revoked, expired.
- Owner capabilities:
  - manage entity profile
  - invite/revoke members
  - promote/demote members between `owner` and `user`
  - manage Plaid connections
- User capabilities:
  - view entity ledger, create/edit allowed transactions, participate in workflows
- System invariant: entity must always have at least one owner.

### Authentication and Session Security
- Auth framework is Auth.js (NextAuth.js) only; no parallel auth system is allowed.
- Initial provider is Google Sign-In via Auth.js.
- Session and token validation are server-side only.
- Session cookies must be secure, HTTP-only, and same-site constrained.
- Convex public queries/mutations must validate identity via `ctx.auth.getUserIdentity()` and bind to canonical `userId`.
- Convex callers must use short-lived server-minted JWTs backed by RS256 + JWKS (`convex/auth.config.ts`).
- Shared wrapper functions (`authenticatedQuery` / `authenticatedMutation` / `superAdmin*`) are required for deny-by-default authorization.
- Sensitive mutations (role changes, payouts, storage setup) require fresh server-verified auth context.
- All authorization decisions must bind authenticated user identity to requested entity/resource.

### Ledger and Transactions
- Ledger items support both `income` and `expense` types.
- One-off transactions include amount, date, category, notes, payee/merchant.
- Recurring transactions include schedule, start date, optional end date, and next run preview.
- Editing recurrence supports "this instance" and "all future" behavior.
- Transaction statuses: pending, posted, voided.
- Audit trail on create/update/delete with actor and timestamp.

### Automation and Plaid Integration
- Plaid Link integration for bank account connection (owner-authorized).
- Import and normalize account + transaction data per entity.
- Deduplication rules for imported and manual entries.
- Auto-categorization rules and merchant normalization.
- Sync health status and error visibility in entity settings.

### Document Uploads
- Upload and store entity-scoped documents (receipts, invoices, contracts, statements).
- Document metadata includes entityId, uploaderUserId, type, sourceTransactionId (optional), and upload timestamp.
- Attach/detach documents to one-off or recurring transaction instances.
- Support secure document download links through CloudFront paths mapped to entity storage keys.
- Audit document upload/delete actions with actor and timestamp.

### Super Admin Storage Dashboard
- Introduce platform role `super_admin` for infrastructure-only settings.
- Provide an admin dashboard to configure and validate S3 bucket + CloudFront distribution settings.
- Dashboard supports setup operations with short-lived AWS session credentials or server-assumed IAM role credentials.
- Dashboard provisions/updates:
  - S3 bucket settings (encryption, versioning, lifecycle, CORS baseline).
  - CloudFront distribution settings for document delivery.
  - Bucket-to-distribution mapping used by document URLs.
- Security constraints:
  - Enforce explicit `super_admin` authorization server-side for every setup operation.
  - Require recent authentication before privileged infrastructure changes.
  - Never persist raw AWS secret keys in app database logs.
  - Use server-side execution for AWS calls only.
  - Redact sensitive credential fields in all logs and audit events.

### Post-submit UX Feedback (Global)
- Successful form submissions must always produce visible success feedback through branded, accessible toast notifications.
- Success paths should redirect to the destination view with a toast signal, then clear ephemeral toast metadata from the URL.
- Redirect targets must reflect the completed task state (for example, after entity creation, open the created entity view).

Phase 2:

- Approval workflows for high-value or sensitive transactions.
- Cross-entity reporting for users with multiple memberships.
- Cash-flow forecasting based on recurring schedules + imported history.
- Alerts for unusual spending, missed expected income, and sync failures.

Phase 3:

- Advanced automations (rule chaining, threshold actions, reminders).
- Tax-oriented tagging and export packages for business entities.
- Role templates for larger teams beyond `owner`/`user`.

## Non-functional Requirements
- Reliability: 99.9% uptime target for authenticated experience.
- Performance: initial entity dashboard load <2.5s on median US broadband.
- Accessibility: WCAG 2.2 AA across entity management and ledger workflows.
- Security:
  - encrypted secrets/tokens, least-privilege access, audited role changes
  - zero trust for client-supplied identity fields
  - mandatory server-side authorization checks for all protected reads/writes
  - private object storage with encryption at rest and TLS in transit
  - controlled document access via CloudFront with signed or restricted delivery patterns
  - dependency and secrets scanning in CI before release gates
- Compliance: privacy controls aligned with GDPR/CCPA principles.

## Data & Integrations
Core integrations:

- Auth.js (NextAuth.js) with Google Sign-In as initial provider and sole auth framework.
- Convex as source of truth for entities, memberships, ledger entries, recurring rules, and audit logs.
- Plaid API for account linking, transaction import, and webhooks.
- Resend for invitations and system notifications.
- Stripe for subscription billing.
- AWS S3 for object storage of uploaded documents.
- AWS CloudFront for secure document distribution.

Core domain objects (initial):

- `entities` (type, profile, owner metadata)
- `entityMemberships` (userId, entityId, role, status)
- `entityInvitations` (email, role, inviter, token, expiry)
- `transactions` (entityId, type, source, status, amount, category, postedAt)
- `recurringRules` (entityId, cadence, nextRunAt, template payload)
- `plaidConnections` and `plaidAccounts` (entity-scoped)
- `entityDocuments` (entityId, storageKey, fileName, mimeType, size, uploadedBy)
- `storageConfigurations` (bucket, region, distributionId, status, updatedBy)
- `auditEvents` (entityId, actorUserId, action, target, metadata)

## Security Architecture
- Identity:
  - Auth.js-managed sessions as the single source of identity truth.
  - No client-trusted role elevation paths.
- Authorization:
  - Role and ownership checks enforced server-side at every API/data boundary.
  - `super_admin` access isolated to platform infrastructure configuration endpoints.
- Secret Handling:
  - Secrets and keys managed via environment/secret manager only.
  - AWS setup credentials must be short-lived and never persisted.
- Data and Document Protection:
  - Entity isolation at query, mutation, and object key namespace levels.
  - Private S3 buckets with encryption, CloudFront-controlled delivery, and access logging.
- Operational Security:
  - Audit trails for auth events, privilege changes, financial mutations, and admin storage changes.
  - Release gate requires passing security checks and no unresolved critical vulnerabilities.

## Open Questions
- Are tax identifiers required during business entity creation or deferred?
- Should `user` role be allowed to edit recurring schedules or only create one-off entries?
- Should Plaid imports require owner approval before posting to entity ledger?
- Do we need per-entity category templates by type (`household` vs `business`) at launch?
- Should super_admin AWS setup credentials be input per-session only, or sourced exclusively from environment-managed secrets?
- Should MFA be mandatory for `super_admin` users in v1 or in Phase 2 hardening?

## Risks & Mitigations
- Risk: role complexity introduces permission bugs.
  Mitigation: central authorization helpers, role matrix tests, and ownership invariants.
- Risk: Plaid sync reliability issues reduce trust.
  Mitigation: explicit sync status, retry/backfill jobs, and manual fallback entry.
- Risk: recurring rule misconfiguration causes ledger drift.
  Mitigation: preview engine, change confirmations, and anomaly alerts.
- Risk: blending household and business requirements inflates MVP scope.
  Mitigation: strict Phase 1 boundary and entity-type-specific progressive enhancement.
- Risk: storage misconfiguration could expose sensitive documents.
  Mitigation: private buckets, CloudFront access controls, encryption at rest, and security configuration checks in dashboard.
- Risk: session hijacking or auth bypass compromises financial data.
  Mitigation: Auth.js hardening, secure cookie settings, short session lifetime, and server-side authorization on every protected operation.

## Success Metrics
- Entity creation conversion rate
- Invite acceptance rate by role (`owner`, `user`)
- Weekly active entities
- Transaction capture completeness (manual + imported coverage)
- Recurring rule adoption and execution success rate
- Plaid connection success and sync freshness
- Document upload adoption and successful retrieval rate

## Rollout Plan
1. Alpha (internal + 20 entities)
   - Validate entity creation, membership invites, and base transaction model.
2. Private beta (200 entities)
   - Add recurring automation, Plaid import/reconciliation, role hardening, document upload pipeline, and security testing.
3. Public launch
   - Expand reporting, onboarding templates, and conversion funnel.
4. Post-launch optimization
   - Improve automation intelligence, cross-entity workflows, and continuous security monitoring.

## Next Steps
1. Finalize entity schema and role permission matrix.
2. Implement Auth.js + Convex identity and membership binding.
3. Implement entity CRUD and invitation lifecycle.
4. Build ledger CRUD with recurring engine (one-off + recurring).
5. Integrate Plaid Link + webhook sync pipeline.
6. Implement super_admin AWS setup dashboard for S3/CloudFront configuration.
7. Add analytics and operational dashboards tied to KPIs.
8. Complete security hardening checklist before public launch (auth, authorization, storage, and audit controls).
