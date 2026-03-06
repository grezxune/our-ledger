export type EntityType = "household" | "business";
export type MembershipRole = "owner" | "user";
export type PlatformRole = "user" | "super_admin";
export type InviteStatus = "pending" | "accepted" | "revoked" | "expired";
export type TransactionKind = "one_off" | "recurring";
export type TransactionType = "income" | "expense";
export type TransactionStatus = "pending" | "posted" | "voided";
export type BudgetPeriod = "weekly" | "monthly" | "yearly";
export type BudgetStatus = "draft" | "active" | "archived";
export type AccountSource = "manual" | "plaid";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  platformRole: PlatformRole;
}

export interface EntityAddress {
  formatted: string;
  line1: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  countryCode: string;
  placeId?: string;
}

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  address: EntityAddress;
  currency: string;
  description?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  entityId: string;
  userEmail: string;
  role: MembershipRole;
  createdAt: string;
}

export interface Invitation {
  id: string;
  entityId: string;
  email: string;
  role: MembershipRole;
  status: InviteStatus;
  invitedBy: string;
  createdAt: string;
}

export interface RecurrenceRule {
  cadence: string;
  startDate: string;
  endDate?: string;
  nextRunAt?: string;
}

export interface LedgerTransaction {
  id: string;
  entityId: string;
  source: "manual" | "plaid";
  kind: TransactionKind;
  type: TransactionType;
  status: TransactionStatus;
  amountCents: number;
  date: string;
  category: string;
  notes?: string;
  payee?: string;
  recurrence?: RecurrenceRule;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetIncomeSource {
  id: string;
  budgetId: string;
  entityId: string;
  name: string;
  amountCents: number;
  cadence: BudgetPeriod;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetRecurringExpense {
  id: string;
  budgetId: string;
  entityId: string;
  accountId?: string;
  categoryId?: string;
  name: string;
  amountCents: number;
  cadence: BudgetPeriod;
  autoPay: boolean;
  category?: string;
  notes?: string;
  paidFromAccount?: {
    id: string;
    name: string;
    source: AccountSource;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BudgetUnplannedIncomeSource {
  id: string;
  budgetId: string;
  entityId: string;
  month: string;
  accountId?: string;
  accountName?: string;
  name: string;
  amountCents: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetOneOffExpenseEntry {
  id: string;
  budgetId: string;
  entityId: string;
  month: string;
  accountId: string;
  accountName: string;
  name: string;
  amountCents: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetMonthlyAccountBalance {
  id: string;
  budgetId: string;
  entityId: string;
  month: string;
  accountId: string;
  accountName: string;
  balanceCents: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCreditCardReconciliation {
  id: string;
  budgetId: string;
  entityId: string;
  month: string;
  accountId: string;
  accountName: string;
  statementBalanceCents: number;
  ledgerBalanceCents: number;
  reconciliationGapCents: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EntityBudgetSummary {
  projectedIncomeCents: number;
  projectedExpenseCents: number;
  expectedRemainingCents: number;
}

export interface EntityBudget {
  id: string;
  entityId: string;
  name: string;
  period: BudgetPeriod;
  effectiveDate: string;
  status: BudgetStatus;
  summary: EntityBudgetSummary;
  incomeSources: BudgetIncomeSource[];
  recurringExpenses: BudgetRecurringExpense[];
  createdAt: string;
  updatedAt: string;
}

export interface BudgetMonthlySnapshot {
  month: string;
  expectedIncomeCents: number;
  expectedExpenseCents: number;
  expectedRemainingCents: number;
  actualIncomeCents: number;
  actualExpenseCents: number;
  actualRemainingCents: number;
  incomeVarianceCents: number;
  expenseVarianceCents: number;
  remainingVarianceCents: number;
  unplannedIncomeCents: number;
  oneOffExpenseCents: number;
  unplannedIncomeSources: BudgetUnplannedIncomeSource[];
  oneOffExpenseEntries: BudgetOneOffExpenseEntry[];
  accountBalances: BudgetMonthlyAccountBalance[];
  creditCardReconciliations: BudgetCreditCardReconciliation[];
  reconciledCardCount: number;
  totalReconciliationGapCents: number;
  totalAccountBalanceCents: number;
}

export interface EntityAccount {
  id: string;
  entityId: string;
  name: string;
  currency: string;
  source: AccountSource;
  institutionId?: string;
  institutionName?: string;
  plaidAccountId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EntityDocument {
  id: string;
  entityId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  cloudFrontUrl?: string;
  sourceTransactionId?: string;
  uploadedBy: string;
  createdAt: string;
}

export interface StorageConfiguration {
  id: string;
  bucket: string;
  region: string;
  cloudFrontDistributionId?: string;
  cloudFrontDomain?: string;
  updatedBy: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  entityId?: string;
  actorEmail: string;
  action: string;
  target: string;
  createdAt: string;
  metadata?: Record<string, string>;
}

export interface AuditRecordSnapshot {
  table: string;
  id: string;
  exists: boolean;
  data: Record<string, unknown> | null;
}

export interface AuditEventDetail extends AuditEvent {
  entity: {
    id: string;
    name: string;
    type: EntityType;
    currency: string;
  } | null;
  targetType: string | null;
  targetRecord: AuditRecordSnapshot | null;
  relatedRecords: AuditRecordSnapshot[];
}
