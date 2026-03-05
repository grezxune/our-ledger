---
title: Entity Budget Builder
created: 2026-02-19
status: draft
owner: Tommy
log:
  - 2026-02-19: Initial requirements documented for entity-level budget planning (income sources + recurring expenses).
  - 2026-02-19: Defined v1 scope as planning-only (separate from transactions and Plaid actuals).
  - 2026-02-19: Expanded requirements for expected remaining money, weekly/monthly/yearly periods, and entity section navigation (budget/transactions/members) with mobile-first behavior.
  - 2026-02-19: Added paid-from account requirements for recurring expenses, including in-context account creation and plaid/manual account sources.
  - 2026-02-26: Clarified inline expense-category creation behavior to treat duplicate-name submissions as idempotent instead of surfacing uncaught runtime errors.
  - 2026-02-26: Updated inline create behavior for category/institution/account modals to avoid full-page refresh and preserve in-progress form inputs.
  - 2026-02-26: Standardized modal positioning to always open centered across mobile and desktop breakpoints.
  - 2026-02-26: Required add-new sentinel options to remain available in relevant selects (category/account/institution) even when options already exist.
  - 2026-02-26: Aligned institution creation UX with other add-new flows by opening institution creation in its own modal triggered from the Institution select add option.
  - 2026-02-26: Removed standalone recurring-expense tile add-category/add-account buttons in favor of select-triggered add-new interactions.
  - 2026-02-26: Added full recurring planned expense edit support from row actions (name/amount/cadence/category/account/notes) with persisted updates and audit logging.
  - 2026-02-26: Standardized recurring planned expense list rendering to a compact table layout aligned with planned income source presentation.
  - 2026-02-26: Updated recurring planned expense table to include dedicated category/account columns for faster row scanning.
  - 2026-02-26: Standardized planned-income and recurring-expense creation UX to use inline input rows under tables (with notes in a secondary full-width row when no notes column exists).
  - 2026-02-26: Refined inline planned-entry rows to use ghost-style borderless fields with tighter spacing, matching ledger-style transaction entry patterns.
  - 2026-02-26: Updated inline planned-entry focus behavior to bottom-border-only emphasis with no rounded/full-border focus treatment.
  - 2026-02-26: Updated inline planned-entry rows to remove border radius in unfocused and focused states via explicit square-corner field support.
  - 2026-02-26: Added compatibility fallback for budget line-item updates when deployed Convex environments are missing `budgets/incomeMutations:*` functions.
  - 2026-02-26: Standardized shared select behavior to use body-portal overlays with viewport-aware flipping/clamping and keyboard typeahead matching.
  - 2026-02-26: Added responsive recurring-planned-expense mobile fallback layouts to prevent horizontal overflow and keep creation/edit actions usable on small screens.
  - 2026-02-26: Brought planned-income responsive behavior into parity with recurring-expense patterns (stacked mobile rows/forms + compact desktop table rows).
  - 2026-03-03: Added requirement that all successful budget mutations redirect with success toasts for explicit confirmation and form reset behavior.
  - 2026-03-04: Replaced redirect-after-save requirement for in-place budget edits with reactive Convex queries and optimistic client mutations for immediate visual updates.
  - 2026-03-04: Aligned with app-wide architecture guardrails that prohibit reintroducing route-level server-action mutation handlers.
  - 2026-03-04: Added recurring planned expense `autoPay` toggle support so users can mark expenses that are automatically pulled each cycle.
  - 2026-03-04: Updated modal behavior so successful budget edit/delete confirmations close active modals immediately.
  - 2026-03-05: Expanded scope with month-level plan-vs-actual snapshots, account-level credit card reconciliation, and one-off unplanned income entries.
---

## Problem
Our Ledger currently supports transaction capture and Plaid-imported actuals, but users cannot build a forward-looking budget for an entity. Users need a planning workspace where they can define expected income and recurring expense commitments before or independent of real transactions.

Without a budgeting module, users cannot:
- Model expected weekly/monthly/yearly cash flow clearly.
- Track planned surplus/shortfall at the entity level.
- Separate “plan” from “actual” in a structured way.

## Business Context
Budget planning is a core behavior for both target entity types:
- `household`: paycheck planning, rent/utilities, subscriptions, debt payments.
- `business`: recurring revenue expectations, payroll, rent, software, contractor retainers.

Adding an entity-scoped budget builder improves retention and product depth by enabling proactive planning, not just historical tracking. It also strengthens Our Ledger’s positioning versus transaction-only tools.

## Goals & KPIs
Primary goals:
- Add a dedicated entity budget section for planning.
- Support multiple income sources with `name` and `amount` inputs.
- Support recurring planned expenses that are not required to be ledger transactions.
- Support budget periods `weekly`, `monthly` (default), and `yearly`.
- Show expected money left after all planned income and expenses are applied for the selected period.
- Add monthly snapshot analytics comparing expected vs actual income/expense/remaining totals.
- Support account-level credit card balance reconciliation per month.
- Support one-off unplanned income entries that can be added for a specific month.
- Preserve clear separation between planned budget items and actual transaction data.

KPIs (first 90 days after release):
- 50%+ of active entities create at least one budget.
- 70%+ of created budgets include at least two income sources or recurring expenses.
- 40%+ of entities revisit/edit a budget in a later session.
- 0 critical authorization defects involving entity budget data access.

## Personas/Journeys
Primary personas:
- Entity `owner` planning shared finances.
- Entity `user` collaborating on budget assumptions (role behavior finalized in Open Questions).

Core journeys:
1. Open budget section
   - User navigates to a dedicated Budget section within an entity.
2. Create budget period
   - User creates a budget and selects `weekly`, `monthly` (default), or `yearly`.
3. Add income sources
   - User adds multiple planned income sources with names and amounts.
4. Add recurring expenses
   - User adds recurring expense items with names, amounts, and cadence.
5. Review totals
   - User sees projected income, projected recurring expenses, and expected remaining money for the selected period.
6. Update assumptions
   - User edits/removes items without creating any ledger transactions.

## Functional Requirements
### Information Architecture & Routing
- Add a dedicated budget route under entity context:
  - `/app/entity/[id]/budget/page.tsx` (budget overview/list)
  - `/app/entity/[id]/budget/create/page.tsx` (create budget)
  - `/app/entity/[id]/budget/[budgetId]/update/page.tsx` (edit budget)
  - `/app/entity/[id]/budget/[budgetId]/manage/page.tsx` (manage items/summary)
- Add entity navigation entry: `Budget`.

### Budget Object (Planning Container)
- A budget belongs to exactly one entity.
- Required budget fields:
  - `entityId`
  - `name` (example: `March 2026 Budget`)
  - `period` (`weekly`, `monthly`, `yearly`) with default `monthly`
  - `effectiveDate`
  - `status` (`draft`, `active`, `archived`)
- Only one `active` budget per entity per period.

### Planned Income Sources
- User can add, edit, and remove multiple income sources within a budget.
- Each income source requires:
  - `name` (string)
  - `amount` (currency decimal)
- Optional fields:
  - `cadence` (`weekly`, `monthly`, `yearly`)
  - `notes`
- System stores normalized period equivalents used to compute expected remaining money by selected budget period.

### Planned Recurring Expenses
- User can add, edit, and remove recurring planned expenses within a budget.
- Each recurring expense requires:
  - `name` (string)
  - `amount` (currency decimal)
- Optional fields:
  - `cadence` (`weekly`, `monthly`, `yearly`)
  - `category` (entity-defined or default taxonomy)
  - `autoPay` (boolean; defaults to `false`) to denote whether the expense is automatically pulled on its cadence
  - `notes`
- Inline category creation from planning forms must handle duplicate-name submissions gracefully (no uncaught runtime error) and return users to the budget workflow.
- Inline category/institution/account creation from planning modals must update options in place without a full-page refresh so unsaved form inputs remain intact.
- Category/account/institution selects must keep an explicit add-new option available even when one or more existing options are present.
- Institution add-new in account flows must be triggered from the Institution select option and open a dedicated modal (no separate inline/below-select add button).
- Recurring planned expense tile must not include separate add-category/add-account buttons; those add-new flows are triggered from select options only.
- Existing recurring planned expenses must support full edit flows (name, amount, cadence, category, paid-from account, notes) from row-level action menus.
- System stores normalized period equivalents used to compute expected remaining money by selected budget period.

### Summary & Calculations
- Budget summary must display:
  - total projected income for the selected budget period
  - total projected recurring expenses for the selected budget period
  - expected remaining money for the selected budget period (`income - expenses`)
- Summary updates immediately after item create/edit/delete.
- Display values in entity currency.
- Provide period-aware normalization for line items when item cadence differs from budget period.

### Monthly Snapshot (Plan vs Actual)
- Budget workspace must include a month selector (`YYYY-MM`) and month-level snapshot section.
- Snapshot must calculate:
  - expected monthly income (normalized planned income + month-scoped unplanned income)
  - expected monthly recurring expenses (normalized recurring planned expenses)
  - expected monthly remaining (`expected income - expected expenses`)
  - actual monthly income/expenses/remaining from posted transactions in the selected month
  - monthly variance values (`actual - expected`) for income, expenses, and remaining.
- Snapshot must update reactively after relevant budget/transaction/monthly-adjustment changes.
- Snapshot must not mutate ledger transactions.

### Unplanned One-Off Income (Monthly)
- Users can add and remove month-scoped one-off income sources from budget workspace.
- Each unplanned income source requires:
  - `month` (`YYYY-MM`)
  - `name`
  - `amount`
- Optional field:
  - `notes`
- Month-scoped unplanned income must be included in expected monthly snapshot income totals.

### Credit Card Reconciliation (Monthly)
- Users can save and remove monthly reconciliation entries per account.
- Reconciliation entry requires:
  - `month` (`YYYY-MM`)
  - `accountId`
  - `statementBalanceCents`
  - `ledgerBalanceCents`
- Optional field:
  - `notes`
- Saving reconciliation for an existing (`budgetId`, `month`, `accountId`) tuple updates existing record (idempotent upsert behavior).
- Snapshot should surface per-account reconciliation gap (`statement - ledger`) and total monthly gap.

### Sophisticated Budgeting Tooling (Execution Bar)
- Budgeting UX must feel production-grade for both `household` and `business` entities.
- Include high-signal budget diagnostics:
  - top expense concentration
  - coverage ratio (`income / recurring expenses`)
  - surplus health state (`healthy`, `tight`, `deficit`) based on configurable thresholds
- Provide scenario-safe workflows:
  - duplicate budget into a draft scenario
  - compare scenario summary deltas before activation
- Keep budget planning independent from transaction posting while enabling future plan-vs-actual analytics.

### Separation from Transactions/Plaid (Non-Negotiable)
- Budget items are planning records only.
- Creating/updating/removing budget items must NOT create, modify, or delete ledger transactions.
- Plaid imports must NOT automatically write to budget items in v1.
- Any future “plan vs actual” comparison is read-only joining logic, not shared storage objects.

### Permissions & Authorization
- All budget reads/writes require authenticated membership in the entity.
- Authorization checks must be server-side and role-aware.
- Never trust client-supplied `userId` or role for budget operations.
- Audit log required for budget create/update/delete actions.

### UX Requirements
- Budget builder UI must follow `UxStyle.md` and support light/dark mode.
- Use shared form primitives where applicable (`InputField`, `SelectField`, `TextareaField`).
- Mobile-first, flex-based layout with no horizontal overflow on any viewport size.
- Planned income and recurring planned expense lists should use compact table-style row density rather than padded card-per-row list items.
- Recurring planned expense tables should include explicit category and paid-from account columns.
- Planned income and recurring planned expense creation should happen via inline input rows beneath table data, not detached card blocks or creation modals.
- For tables without a dedicated notes column, notes entry should be placed in a compact secondary row directly below the main input row.
- Inline planned-entry rows should use borderless ghost-style fields and tight cell spacing, avoiding isolated rounded input boxes within the row.
- Inline planned-entry fields should remain square in all states (no rounded corners when focused or unfocused).
- Inline planned-entry focus states should use bottom-border-only emphasis (no full-border/ring focus outlines).
- Shared modal workflows (including inline create modals) must open centered on all viewport sizes.
- Successful modal save/confirm actions in budget workflows must close the modal immediately; failed submissions must keep the modal open and show errors.
- Shared select menus used in budget flows should render via `document.body` portal overlays, auto-flip up/down to stay visible, and support keyboard type-to-jump option matching.
- Recurring planned expense displays and creation rows must gracefully stack on small screens instead of requiring horizontal scrolling.
- Planned income displays and creation rows must follow the same responsive breakpoint strategy/pattern family as recurring planned expenses.
- Inline validation and clear empty states:
  - no budget created
  - budget with zero items
  - invalid amount/cadence
- Budget create/update/remove actions within the budget workspace must update in place via reactive queries and optimistic client mutations (no mandatory page redirect).
- Successful actions must still provide accessible confirmation feedback without forcing route-level reloads.
- Route-level server actions are disallowed for budget mutations; only client mutation flows (or explicit API routes for external side effects) are permitted.
- Include entity navigation with dedicated sections for:
  - Budget
  - Transactions
  - Members (invites)
- Entity navigation must include a mobile menu variant with keyboard support and smooth transitions.

## Non-functional Requirements
- Performance:
  - budget overview load <2.0s median on broadband.
  - item create/edit/delete roundtrip <500ms p50 for standard payloads.
  - monthly snapshot query (plan vs actual + reconciliation aggregates) <700ms p50 for standard entities.
- Accessibility:
  - keyboard-accessible forms and controls.
  - WCAG 2.2 AA contrast and semantics.
- Reliability:
  - idempotent mutation handling for duplicate submits.
- Security:
  - deny-by-default authorization.
  - immutable audit trail for budget mutations.
  - no sensitive data in logs.

## Security Architecture & Threat Model
- Trust boundaries:
  - Client UI is untrusted.
  - Convex public functions are trusted only after server-side auth + membership checks.
  - Auth.js identity and Convex actor identity must be canonicalized before budget access.
- Primary abuse cases:
  - Cross-entity budget read/write attempts via forged IDs.
  - Unauthorized modification of monthly reconciliation entries.
  - Injection of malformed month keys to read unintended date ranges.
  - Sensitive financial metadata leakage through logs/audit payloads.
- Required controls:
  - Enforce membership checks for all monthly snapshot, unplanned income, and reconciliation reads/writes.
  - Validate month key shape (`YYYY-MM`) and numeric inputs server-side.
  - Enforce account ownership (`account.entityId === budget.entityId`) before reconciliation writes.
  - Audit all create/update/delete operations for unplanned income and reconciliation objects.
  - Keep logs free from secrets/tokens/raw auth material.

## Performance Strategy & Budgets
- Query design:
  - Use entity and budget scoped indexes for monthly reads (`by_budgetId_month`, `by_entityId_date`).
  - Prevent unbounded scans by always filtering snapshot queries with month start/end ranges.
- Render strategy:
  - Keep monthly snapshot in reactive query path with client-side month switching.
  - Avoid full route reloads for month changes and line-item mutations.
- Budgets:
  - Monthly snapshot render target <2.0s median including initial budget page load.
  - Month switch interaction target <400ms p50 query-to-render under normal network conditions.
  - Mutation feedback target <500ms p50 with optimistic/non-blocking UI.

## Data & Integrations
### Convex Data Model (Proposed)
- `entityBudgets`
  - `entityId: v.id("entities")`
  - `name: v.string()`
  - `period: v.union(v.literal("weekly"), v.literal("monthly"), v.literal("yearly"))`
  - `effectiveDate: v.string()`
  - `status: v.union(v.literal("draft"), v.literal("active"), v.literal("archived"))`
  - `createdByUserId: v.id("users")`
  - `updatedByUserId: v.id("users")`
  - Indexes: `by_entityId`, `by_entityId_period`, `by_entityId_status`, `by_entityId_updatedAt`
- `budgetIncomeSources`
  - `budgetId: v.id("entityBudgets")`
  - `entityId: v.id("entities")`
  - `name: v.string()`
  - `amountCents: v.number()`
  - `cadence: v.union(v.literal("weekly"), v.literal("monthly"), v.literal("yearly"))`
  - `normalizedAmountCents: v.number()`
  - Indexes: `by_budgetId`, `by_entityId`
- `budgetRecurringExpenses`
  - `budgetId: v.id("entityBudgets")`
  - `entityId: v.id("entities")`
  - `name: v.string()`
  - `amountCents: v.number()`
  - `cadence: v.union(v.literal("weekly"), v.literal("monthly"), v.literal("yearly"))`
  - `normalizedAmountCents: v.number()`
  - `autoPay: v.optional(v.boolean())` (backward-compatible in schema, treated as `false` when omitted)
  - `category: v.optional(v.string())`
  - Indexes: `by_budgetId`, `by_entityId`, `by_entityId_category`
- `budgetUnplannedIncomeSources`
  - `budgetId: v.id("entityBudgets")`
  - `entityId: v.id("entities")`
  - `month: v.string()` (`YYYY-MM`)
  - `name: v.string()`
  - `amountCents: v.number()`
  - `notes: v.optional(v.string())`
  - Indexes: `by_budgetId_month`, `by_entityId_month`
- `budgetCreditCardReconciliations`
  - `budgetId: v.id("entityBudgets")`
  - `entityId: v.id("entities")`
  - `month: v.string()` (`YYYY-MM`)
  - `accountId: v.id("entityAccounts")`
  - `statementBalanceCents: v.number()`
  - `ledgerBalanceCents: v.number()`
  - `notes: v.optional(v.string())`
  - Indexes: `by_budgetId_month`, `by_entityId_month`, `by_budgetId_month_accountId`

### Integration Boundaries
- Auth.js: identity/session.
- Convex: budgets and budget items storage.
- Plaid: unchanged in v1 budget builder (no write coupling).
- Ledger transactions: unchanged in v1 budget builder (no write coupling).

## Open Questions
- Should `user` role have edit rights on budgets, or view-only with `owner` edit rights?
- Should v1 allow more than one active budget per entity for scenario planning?
- Should `user` role edit permissions differ by entity type (`household` vs `business`)?
- Should category taxonomy be shared with transaction categories at launch?
- Should budget items support planned start/end dates for seasonal/temporary costs in v1?
- Should budget diagnostics thresholds be globally configured or entity-customized?

## Risks & Mitigations
- Risk: users confuse budget items with actual transactions.
  Mitigation: explicit UI labels (`Planned`, `Not posted`), separate navigation, and no auto-ledger writes.
- Risk: cadence normalization errors produce incorrect summary totals.
  Mitigation: shared normalization utility + unit tests for weekly/monthly/yearly conversion math.
- Risk: permission drift exposes budget data across entities.
  Mitigation: centralized membership authorization helper and entity-scoped indexes.
- Risk: scope creep into full forecasting delays delivery.
  Mitigation: strict v1 boundary around budget authoring + summary only.

## Success Metrics
- Budget creation rate per active entity.
- Median count of planned items per budget.
- Budget revisit/edit frequency.
- Ratio of entities with at least one active budget.
- Error rate for budget create/update mutations.

## Rollout Plan
1. Phase 1: Internal alpha
   - Schema, CRUD, and UI for budget + income/expense planning items.
   - Dedicated entity sections: Budget, Transactions, Members + mobile entity nav.
   - Security and auth validation.
2. Phase 2: Private beta
   - Polish UX, improve validation, add lightweight analytics.
3. Phase 3: Public release
   - Roll out to all entities.
   - Add docs/onboarding guidance.
4. Phase 4: Post-launch enhancements
   - Expanded scenario comparisons and trend diagnostics.
   - Optional templates by entity type.

## Next Steps
1. Finalize role permissions (`owner` vs `user`) for budget editing.
2. Finalize and lock period model (`weekly`, `monthly` default, `yearly`).
3. Define Convex schema + indexes and audit event contracts.
4. Build App Router budget routes and entity navigation entry.
5. Implement budget CRUD with cadence normalization utilities.
6. Add unit, integration, and E2E coverage for budget flows.
7. Instrument KPI events (budget created, item added, budget updated).
