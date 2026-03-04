# Changelog

## [0.2.58] - 2026-03-03

- Added a shared query-driven toast system (`ToastCenter`) inside `AppShell` to provide consistent post-submit success feedback across routes.
- Introduced typed navigation helpers for toast redirects (`src/lib/navigation/toast.ts`) and standardized toast key/message handling.
- Updated server-action success redirects across entity creation/update, budget CRUD flows, transaction creation, member invite flows, document upload, dashboard invite acceptance, and super-admin storage validation to include toast metadata.
- Changed entity creation success navigation to land on the new entity overview (`/entity/[id]`) instead of manage tools, with a creation success toast.

## [0.2.57] - 2026-03-03

- Hardened Convex authorization by introducing shared wrapper-based guards (`authenticated*` and `superAdmin*`) and applying them across public queries/mutations.
- Added Convex custom JWT auth provider config (`convex/auth.config.ts`) with RS256 validation against a new JWKS endpoint at `/api/auth/convex/jwks`.
- Added server-side Convex actor token minting (`src/lib/auth/convex-token.ts`) and switched all server data access modules to authenticated Convex clients.
- Removed insecure Auth.js secret fallback behavior and now fail closed when neither `NEXTAUTH_SECRET` nor `AUTH_SECRET` is configured.
- Restricted developer credentials provider to non-production and removed default passphrase fallback.
- Hardened user upsert/audit/storage flows to rely on authenticated identity and server-authorized `userId` binding.
- Added unit/integration coverage for Convex JWT minting and JWKS route responses.

## [0.2.56] - 2026-02-26

- Added the same mobile responsive pattern to planned income sources as recurring expenses: stacked mobile list rows and stacked mobile creation form.
- Kept desktop compact table + inline add-row behavior while ensuring planned income and recurring expense components stay visually in sync across breakpoints.

## [0.2.55] - 2026-02-26

- Added responsive recurring planned expense layouts: stacked mobile rendering for existing rows and stacked mobile creation form to prevent right-side overflow on small screens.
- Kept compact table + inline-row entry pattern on `md+` while ensuring no required recurring-expense interactions depend on horizontal scrolling.

## [0.2.54] - 2026-02-26

- Upgraded shared `SelectField` to support keyboard type-to-jump matching against option labels.
- Moved select dropdown menus to a `document.body` portal with fixed positioning so menus overlay above all layout containers.
- Added viewport-aware select menu positioning data (top/left/width/max-height) with automatic open-up/open-down behavior and scroll/resize re-measurement.

## [0.2.53] - 2026-02-26

- Added server-action compatibility fallback for budget line-item updates when Convex `budgets/incomeMutations:*` functions are unavailable in the current deployment.
- Recurring expense and income source edits now degrade safely by replacing the original line item (add replacement then remove original) instead of crashing with missing-function runtime errors.

## [0.2.52] - 2026-02-26

- Added explicit square-corner support on shared `InputField`/`SelectField` so inline table-entry controls render without border radius in both focused and unfocused states.
- Applied the square-corner under-table input standard across planned-income and recurring-expense inline entry rows.

## [0.2.51] - 2026-02-26

- Updated inline planned-entry row focus treatment to remove rounded focus states and use bottom-border-only emphasis (no full border/ring highlight).
- Added this focus-style requirement to `UxStyle.md` for future under-table input rows.

## [0.2.50] - 2026-02-26

- Updated planned-income and recurring-expense inline table entry rows to use ghost-style inputs/selects (no per-field borders/background blocks) with tighter cell spacing.
- Added UX standard requiring borderless/tight under-table input row styling for planned line-item creation.

## [0.2.49] - 2026-02-26

- Switched planned-income creation from modal CTA flow to an inline input row under the income table.
- Switched recurring planned-expense creation to an inline input row under the recurring table, with a secondary full-width notes row.
- Updated `UxStyle.md` and budget PRD to standardize inline under-table input rows for planned line-item creation.

## [0.2.48] - 2026-02-26

- Added dedicated `Category` and `Account` columns to the recurring planned expenses table for clearer scanning.
- Updated `UxStyle.md` planning table standard to require separate category/account columns for recurring planned expenses.

## [0.2.47] - 2026-02-26

- Refactored recurring planned expenses from spaced card rows into a compact table layout aligned with planned income source presentation.
- Standardized planned line-item presentation guidance in `UxStyle.md` so planned income and recurring expenses both default to dense table patterns going forward.

## [0.2.46] - 2026-02-26

- Added full edit support for recurring planned expenses from the row action menu, including name, amount, cadence, category, paid-from account, and notes.
- Wired recurring-expense update mutations through the budget actions/data layer and audit events so edits persist with entity ownership validation.
- Added/updated recurring-expense list integration coverage for the new edit-capable list configuration.

## [0.2.45] - 2026-02-26

- Added shared select CTA styling for add-new options: divider line above the first add option plus icon + text treatment in dropdown menus.
- Documented the select add-CTA pattern in `UxStyle.md` as a project-wide rule.

## [0.2.44] - 2026-02-26

- Removed standalone `Add Category` and `Add Account` buttons from the recurring planned expenses tile.
- Kept add-new actions accessible only through the corresponding select dropdown options for category/account.

## [0.2.43] - 2026-02-26

- Changed institution creation in the add-account workflow to open a dedicated modal triggered from the Institution select add option.
- Removed the separate below-select `Add Institution` button to keep add-new behavior inside the select path.

## [0.2.42] - 2026-02-26

- Kept `Add Category`, `Add Account`, and `Add Institution` options available in select menus even when existing options are present.
- Extended expense-form helper and integration coverage to lock this non-empty list behavior.

## [0.2.41] - 2026-02-26

- Updated the shared modal container to center dialogs on all breakpoints (including mobile) instead of bottom-docking on small screens.

## [0.2.40] - 2026-02-26

- Removed page-refresh behavior from inline expense category, institution, and account creation flows in budget/transaction forms.
- Updated modal submit flows to perform in-place server action calls and update select options locally so in-progress form entries are preserved.
- Kept recurring expense inline-create state logic co-located in the planner component for cohesion across category/account/institution modal interactions.

## [0.2.39] - 2026-02-26

- Fixed inline expense-category creation in budget/transactions flows to gracefully handle duplicate names without surfacing uncaught runtime errors.
- Added shared duplicate-category error classification helper with unit and integration coverage for safe duplicate handling.

## [0.2.38] - 2026-02-20

- Replaced the transactions form free-text category input with required managed expense category selection.
- Added inline add-category flow to the transactions form so users can create categories without leaving the page.
- Enforced server-side category selection validation for transaction creation using entity-scoped expense categories.

## [0.2.37] - 2026-02-20

- Added entity-scoped expense category management in Convex and required recurring-expense creation to select a category from that collection.
- Replaced free-text recurring expense category input with a required category select plus an inline add-category flow.
- Added a dedicated account modal component and shared expense-form selection helpers/constants to keep account/category/institution selection behavior consistent.
- Expanded audit/detail metadata mapping to resolve `expense_category.*` and `expenseCategoryId` references.

## [0.2.36] - 2026-02-20

- Added an entity-scoped institutions collection in Convex and wired budget account creation to require selecting an institution from that collection.
- Replaced free-text institution entry in recurring-expense account creation with a select-only institution field.
- Added inline institution creation flow in the account modal, including empty-state CTA support when no institutions exist.
- Added Convex audit table mapping for `institution.*` events and refreshed generated Convex API typings.

## [0.2.35] - 2026-02-20

- Added desktop overflow detection for entity section tabs so they gracefully collapse to the existing section menu trigger instead of running off-screen.
- Extended shared `TabNav` with optional nav refs to support layout measurement without duplicating tab markup.
- Added unit coverage for entity tab-collapse threshold behavior.

## [0.2.34] - 2026-02-20

- Fixed Google sign-in button contrast in dark mode by making its styling explicit and independent of theme-driven secondary button text colors.
- Added sign-in integration coverage to assert the Google CTA keeps its dedicated dark text styling.

## [0.2.33] - 2026-02-20

- Added shared `TabNav` component to standardize tab rendering for both horizontal tab bars and stacked tab lists.
- Migrated primary header tabs and entity section tabs to `TabNav`, removing the previous button-inside-tab-bar styling.
- Updated `UxStyle.md` with explicit `TabNav` usage rules and clarified that tabs are exempt from the shared `Button` requirement.

## [0.2.32] - 2026-02-20

- Added `unstyled` support to the shared `Button` so structural controls (full-screen dismiss backdrops) can avoid size/padding styles.
- Fixed mobile menu/modal dismiss overlays to use true full-viewport backdrops across the app (`fixed` + `inset-0`), resolving small click-target overlay issues.
- Updated primary header navigation responsiveness to defer desktop tab rendering until wider breakpoints and rely on drawer navigation before that to prevent cramped tabs.
- Updated `UxStyle.md` with explicit overlay and responsive-header rules to enforce this behavior consistently.

## [0.2.31] - 2026-02-20

- Upgraded shared `Button` with polymorphic `asChild` support so links and buttons share one styling/interaction surface.
- Migrated app-wide button-like links and CTAs (header, mobile drawer, entity overview/manage sections, audits detail, marketing CTAs) to the shared `Button` component.
- Updated modal close controls to use the shared `Button` component.
- Added a `UxStyle.md` rule requiring shared `Button` usage for button-like actions/links and defining limited primitive exceptions.

## [0.2.30] - 2026-02-20

- Introduced dedicated primary-action button color tokens (`action-primary`, `action-primary-hover`, `action-primary-foreground`) to replace the low-contrast light-blue + white CTA treatment.
- Updated shared `Button` primary styles plus header/mobile/marketing primary CTAs to use the new darker action palette.
- Updated `UxStyle.md` with an explicit rule banning light-blue filled primary buttons with white text and documenting the approved button colors.

## [0.2.29] - 2026-02-20

- Redesigned entity section navigation with non-wrapping desktop tab chips and a cleaner mobile section trigger + drawer.
- Fixed entity nav active-route matching so `Overview` is only active on the exact overview route, while section tabs support nested paths.
- Added entity navigation integration coverage to assert exactly one active tab and prevent active-state regressions.

## [0.2.28] - 2026-02-19

- Renamed project naming references from `Ours Ledger`/`ours-ledger` to `Our Ledger`/`our-ledger` across app copy, docs, config, tests, and package metadata.
- Renamed branded image asset filenames from `ours-ledger-*` to `our-ledger-*` and updated all in-app references.
- Renamed GitHub repository from `grezxune/ours-ledger` to `grezxune/our-ledger` and updated local `origin` remote.
- Renamed Vercel project to `our-ledger`, updated linked Git repository, and synced local `.vercel/project.json`.

## [0.2.27] - 2026-02-19

- Moved mobile header navigation into a dedicated portal-rendered drawer component (`MobileNavDrawer`) mounted to `document.body`.
- Enforced full viewport drawer height (`100dvh`) with internal vertical scrolling so long mobile navigation states remain reachable.
- Kept overlay close, explicit close action, and Escape-key dismissal behavior with body scroll lock while the drawer is open.

## [0.2.26] - 2026-02-19

- Rebuilt the global app header into a polished navigation system with a desktop nav rail, stronger visual hierarchy, and clearer action prioritization.
- Added a mobile right-side slide-over navigation experience with backdrop close, explicit close control, and Escape-key support.
- Split header concerns into a new shared `PrimaryHeader` component and simplified `AppShell` to compose that reusable header.

## [0.2.25] - 2026-02-19

- Added shared Auth.js secret resolution that gracefully falls back when `NEXTAUTH_SECRET`/`AUTH_SECRET` are missing.
- Wired NextAuth config to the new resolver so environments without explicit auth secret no longer crash with `NO_SECRET`.
- Added unit tests covering secret precedence and deterministic fallback behavior.

## [0.2.24] - 2026-02-19

- Replaced project no-words logo assets with the updated `~/Documents/our-ledger-logo-no-words.png` source after background removal and tight trimming.
- Rebuilt favicon sources/derivatives from the updated no-words mark and regenerated `src/app/favicon.ico`.
- Updated header branding to use the no-words logo mark with the app title rendered as text to the right of the mark.

## [0.2.23] - 2026-02-19

- Replaced the Documents source logo with the new `~/Downloads/our-ledger-logo.png` asset.
- Overwrote project logo originals/runtime copy with a cleaned version of the new logo (background removed and tightly trimmed to content).
- Regenerated the web-sized header logo from the cleaned original and updated header intrinsic image dimensions to match.

## [0.2.22] - 2026-02-19

- Removed checker/white matte backgrounds from all provided logo assets (both originals and runtime copies) and converted them to true alpha transparency.
- Trimmed all provided logo assets to tight content bounds to eliminate excess canvas/padding around marks and lockups.
- Regenerated favicon/icon derivatives (`16x16`, `32x32`, `apple-touch`, Android, and `src/app/favicon.ico`) from the cleaned transparent source.
- Updated header logo image intrinsic dimensions to match trimmed assets and reduced motto text size for a cleaner lockup.

## [0.2.21] - 2026-02-19

- Imported new brand assets into `public/branding` with both full-size originals and optimized runtime copies.
- Replaced text-based header title with the new logo image and added a mark-only logo variant for smaller screens.
- Reduced the visual size of the "What's mine is ours." line in the header.
- Configured app metadata icons to use the new favicon and apple-touch assets.

## [0.2.20] - 2026-02-19

- Added clickable audit event rows with drill-down links from both the dashboard and a new dedicated `/audits` index route.
- Added audit detail route `/audits/[id]` showing action metadata, resolved target record, and related entity/account/budget/transaction context.
- Added server-side audit visibility filtering and detail resolution in Convex (`listRecent` now user-scoped, plus new `getById` query).
- Enriched audit metadata capture across entity, account, transaction, budget, invitation, document, and storage mutations for higher-fidelity event context.
- Added unit/integration test coverage for audit presentation helpers and audit event list rendering.
- Added PRD `prds/audit-event-drilldown.md` and updated the PRD index.

## [0.2.19] - 2026-02-19

- Lightened the full blue theme palette (background, surfaces, text, lines, and accent strength) to reduce perceived darkness across light and dark modes.
- Added a shared root-level `GlobalParallaxBackground` component so the same animated/parallax backdrop appears on every page, including marketing routes.
- Replaced static body gradient painting with layered animated background primitives that respond to scroll depth and honor reduced-motion preferences.

## [0.2.18] - 2026-02-19

- Removed the visible `Actions` header label from the planned-income table and constrained the action column width for the 3-dot menu.

## [0.2.17] - 2026-02-19

- Replaced remaining green-tinted global theme neutrals with sky-blue variants (`background`, `foreground`, `surface-muted`, and `line`) in light and dark modes.
- Updated the super-admin storage success banner from `emerald` utility classes to `sky` classes to remove the last explicit green success styling.
- Synced `UxStyle.md` surface/text color tokens with the new blue-forward palette.

## [0.2.16] - 2026-02-19

- Generalized shared `ActionMenu` to a modular input model (`id`, `label`, optional `icon`, `tone`, `disabled`, `closeOnSelect`) plus configurable trigger/menu labels and alignment.
- Updated planned-income usage to the new modular menu API so the component can be reused for non-income contexts.

## [0.2.15] - 2026-02-19

- Updated the global primary/accent theme from green to sky blue by replacing shared accent tokens in `src/app/globals.css` for light and dark modes.
- Updated `UxStyle.md` color direction values to match the new sky-blue primary palette.

## [0.2.14] - 2026-02-19

- Replaced planned-income inline action buttons with a compact 3-dot action menu containing labeled `Edit` and `Delete` items.
- Added a shared `ActionMenu` component for consistent row-level contextual actions.
- Added a shared `ConfirmationModal` component (built on shared `Modal`) and routed income-source deletion through explicit confirmation.
- Moved planned-income add/edit form entry from in-page expansion to a shared modal flow opened by CTA/menu actions.
- Routed recurring planned-expense deletion through the same shared confirmation modal pattern for consistency on the budget page.
- Updated local `AGENTS.md` and `UxStyle.md` to require action menus for row actions and confirmation modals for destructive actions.

## [0.2.13] - 2026-02-19

- Moved planned income sources into the primary budget card and redesigned the section into a compact, lower-intensity table layout.
- Added per-income `Edit` actions and an on-demand shared add/edit form so income setup is hidden until needed.
- Added an under-table `Add income source` CTA that opens the form instead of showing full controls by default.
- Added backend update support for budget income sources (`updateIncomeSource`) with server action and data-layer wiring.
- Added unit and integration tests for the new planned-income source component behavior.
- Standardized planned-income row actions so `Edit` and `Delete` both use the same icon-only action styling.
- Added explicit guidance in `AGENTS.md` and `UxStyle.md` requiring consistent control structure across row-level action groups.

## [0.2.12] - 2026-02-19

- Rebuilt shared `Tooltip` as a viewport-aware floating surface that clamps to screen edges and auto-flips vertical placement.
- Added shared dropdown positioning hook and upgraded `SelectField` to open upward/downward based on available space.
- Ensured select menus stay in-viewport with constrained height and internal scrolling, avoiding page-scroll side effects when opened.
- Updated shared modal container to support internal scrolling (`max-height` + `overflow-y-auto`) for oversized content.
- Added explicit floating-surface boundary rules to `UxStyle.md` to keep tooltips/selects/modals consistent going forward.

## [0.2.11] - 2026-02-19

- Standardized standalone icon actions to render without filled backgrounds or borders, using semantic icon color only.
- Updated shared `Button` icon-only behavior to enforce transparent icon actions with accessible sizing and focus treatment.
- Aligned modal/entity mobile-nav close icon controls to the same transparent icon-action pattern.
- Added permanent icon-action guidance to `UxStyle.md` for consistency across future UI work.

## [0.2.10] - 2026-02-19

- Added `lucide-react` and introduced icon-first action affordances across app shell, entity navigation, and core form workflows.
- Replaced budget `Remove` text buttons with accessible trash-can icon actions, including contextual tooltips and explicit ARIA labels.
- Added shared `Tooltip` UI primitive and upgraded shared `Button` to support icons, icon-only mode, and reusable tooltip integration.
- Improved ARIA coverage for high-traffic controls (menus, dialog close controls, select interactions, address suggestions, and action links/buttons).

## [0.2.9] - 2026-02-19

- Added entity account support (`manual` and `plaid` sources) for budget paid-from attribution.
- Updated recurring planned expenses to require a selected paid-from account and persist `accountId` on budget expense records.
- Added an in-page modal account creation flow on the budget screen, including CTA-only select behavior when no accounts exist.
- Added recurring expense planner integration coverage for the no-account CTA state.

## [0.2.8] - 2026-02-19

- Added entity budget planning backend and UI section with expected remaining money summaries and period support (`weekly`, `monthly` default, `yearly`).
- Added dedicated entity sections/routes for `Budget`, `Transactions`, and `Members` (invite management) and refocused `Manage` on operational tools.
- Added entity-scoped responsive navigation with a mobile slide-over menu for section switching.
- Added Convex budget domain tables/functions (`entityBudgets`, `budgetIncomeSources`, `budgetRecurringExpenses`) and server-side data wrappers.
- Added budget period normalization utilities and test coverage (`src/lib/budget/math.test.ts`) plus entity nav integration coverage.

## [0.2.7] - 2026-02-19

- Added `prds/entity-budget-builder.md` defining requirements for a dedicated entity budget planning section (multi-source income + recurring planned expenses, separate from transactions/Plaid).
- Updated `prds/README.md` index with the new budget builder PRD.

## [0.2.6] - 2026-02-19

- Replaced shared `SelectField` native `<select>` styling with a custom dropdown trigger and menu styled to match the Google Places suggestion surface.
- Added explicit right-side trigger padding for the chevron icon to prevent text overlap and improve readability.
- Preserved form-post compatibility by keeping an underlying native `<select>` for submissions/events.
- Added unit and integration tests for custom select rendering and default-value behavior.

## [0.2.5] - 2026-02-19

- Migrated entity address autocomplete from legacy `google.maps.places.Autocomplete` to Places API (New) via server-side `/api/google/places/*` proxy routes.
- Added shared Google Places integration helpers for autocomplete and place detail normalization.
- Added unit coverage for Places API (New) address mapping into `EntityAddress`.
- Updated environment variable docs to prefer server-side `GOOGLE_MAPS_API_KEY` with `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` as optional fallback.

## [0.2.4] - 2026-02-19

- Removed timezone from the entity application model and create/update forms.
- Reworked entity addresses into structured fields and integrated Google Places autocomplete for address capture.
- Added shared `SelectField` UI component and migrated entity/manage form dropdowns away from raw `<select>` usage.
- Updated Convex entity schema/functions and app data wrappers to persist structured addresses.
- Added `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` documentation and project guidance enforcing shared select usage.

## [0.2.3] - 2026-02-19

- Migrated app persistence from the in-memory server store to Convex-backed schema, queries, and mutations.
- Added Convex domain modules for users, entities, memberships, invitations, ledger transactions, documents, storage configuration, and audit events.
- Replaced `src/lib/data/*` implementations with server-only Convex HTTP client wrappers and removed the in-memory state module.
- Updated App Router pages and server actions to await asynchronous Convex data operations end-to-end.
- Kept S3 document upload on the Next.js server and persisted uploaded document metadata via Convex mutation.

## [0.2.2] - 2026-02-19

- Added Bun scripts for Convex workflows:
  - `bun run convex:dev` for local Convex development.
  - `bun run convex:deploy` for production Convex deployment (`--prod`).

## [0.2.1] - 2026-02-19

- Redesigned signed-out home route into a full marketing landing page with high-clarity product messaging, feature sections, and security callouts.
- Refined marketing copy to avoid exposing internal implementation details while keeping Plaid positioning in customer-facing messaging.
- Updated app shell navigation to show only relevant actions by auth state:
  - Signed-out: `Home`, `Sign In`
  - Signed-in: `Dashboard`, `Create Entity`, `Sign Out` (+ `Admin Storage` for `super_admin`)
- Added motion utilities for staged reveal animations with reduced-motion accessibility fallback.
- Expanded integration tests to cover both signed-in and signed-out navigation behavior.
- Redesigned `/signin` into a professional two-panel login experience with polished layout and trust-oriented messaging.
- Implemented industry-standard visual treatment for the Google sign-in button (white surface, border, Google mark, accessible focus states).
- Updated `AGENTS.md` and `UxStyle.md` to explicitly require professional, presentable UI and industry-standard architecture/development/style patterns.
- Replaced direct header sign-out link with a signed-in user avatar menu that opens account actions, including sign out.
- Refined avatar trigger styling to remove outer outline/border and present only the user circle.

## [0.2.0] - 2026-02-19

- Implemented Auth.js (NextAuth.js) authentication with Google + secure dev credentials flow and `super_admin` role derivation.
- Added entity App Router flows: `/entity/create`, `/entity/[id]`, `/entity/[id]/update`, and `/entity/[id]/manage`.
- Implemented owner-managed invitations and role assignment (`owner`/`user`) with acceptance/revocation flow.
- Implemented ledger transaction creation for one-off and recurring manual entries.
- Implemented S3-backed document upload flow with entity-scoped metadata and audit event logging.
- Added `super_admin` storage dashboard (`/admin/storage`) for AWS credential validation and S3/CloudFront setup checks.
- Added server-only data modules, AWS integration modules, route-level security guards, and reusable UI shell/components.
- Added unit and integration tests for role parsing and authenticated app shell behavior.

## [0.1.3] - 2026-02-19

- Strengthened local `AGENTS.md` with Auth.js (NextAuth.js)-only authentication policy.
- Added financial-grade security guardrails to local agent guidance (server-side authorization, credential handling, audit requirements).
- Updated PRD security architecture with explicit auth/session constraints, admin privilege controls, and release security gates.
- Updated README stack and security posture to reflect Auth.js-only auth and financial application security standards.

## [0.1.2] - 2026-02-19

- Added roadmap requirements for entity document uploads (receipts, invoices, contracts) and ledger attachment flows.
- Added roadmap requirements for a `super_admin` AWS setup dashboard to configure S3 bucket and CloudFront distribution settings.
- Documented credential handling constraints for AWS setup workflows (server-side execution, no raw secret persistence).

## [0.1.1] - 2026-02-19

- Updated project documentation to an entity-based model supporting both `household` and `business` workspaces.
- Documented role-based collaboration with invite flows (`owner`, `user`, invite-as-owner support).
- Expanded requirements for one-off and recurring income/expense ledger entries.
- Added Plaid API integration requirements for account linking, import, and automation flows.
- Renamed PRD to `prds/shared-entity-finance-core.md` and updated PRD index references.

## [0.1.0] - 2026-02-19

- Scaffolded Next.js 16 + Tailwind CSS 4 app using Bun.
- Established initial brand shell and homepage for Our Ledger.
- Added project guidance files: `AGENTS.md` and `UxStyle.md`.
- Added PRD roadmap and market research synthesis in `prds/couples-shared-budgeting-core.md`.
- Added baseline unit and integration tests for shared-household messaging.
