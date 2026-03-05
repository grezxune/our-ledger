import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  auditMetadataValidator,
  accountSourceValidator,
  budgetPeriodValidator,
  entityAddressValidator,
  entityTypeValidator,
  inviteStatusValidator,
  membershipRoleValidator,
  platformRoleValidator,
  recurrenceValidator,
  transactionKindValidator,
  transactionStatusValidator,
  transactionTypeValidator,
} from "./lib/validators";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    platformRole: platformRoleValidator,
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_email", ["email"]),

  entities: defineTable({
    type: entityTypeValidator,
    name: v.string(),
    address: v.union(v.string(), entityAddressValidator),
    timezone: v.optional(v.string()), // legacy compatibility field, no longer used by the app
    currency: v.string(),
    description: v.optional(v.string()),
    archivedAt: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }),

  memberships: defineTable({
    entityId: v.id("entities"),
    userId: v.id("users"),
    role: membershipRoleValidator,
    createdAt: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_entityId", ["entityId"])
    .index("by_userId_entityId", ["userId", "entityId"])
    .index("by_entityId_role", ["entityId", "role"]),

  invitations: defineTable({
    entityId: v.id("entities"),
    email: v.string(),
    role: membershipRoleValidator,
    status: inviteStatusValidator,
    invitedByUserId: v.id("users"),
    createdAt: v.string(),
  })
    .index("by_entityId", ["entityId"])
    .index("by_email_status", ["email", "status"])
    .index("by_entityId_email_status", ["entityId", "email", "status"]),

  transactions: defineTable({
    entityId: v.id("entities"),
    source: v.union(v.literal("manual"), v.literal("plaid")),
    kind: transactionKindValidator,
    type: transactionTypeValidator,
    status: transactionStatusValidator,
    amountCents: v.number(),
    date: v.string(),
    category: v.string(),
    notes: v.optional(v.string()),
    payee: v.optional(v.string()),
    recurrence: v.optional(recurrenceValidator),
    createdByUserId: v.id("users"),
    createdByEmail: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_entityId", ["entityId"])
    .index("by_entityId_date", ["entityId", "date"]),

  entityBudgets: defineTable({
    entityId: v.id("entities"),
    name: v.string(),
    period: budgetPeriodValidator,
    effectiveDate: v.string(),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("archived")),
    createdByUserId: v.id("users"),
    updatedByUserId: v.id("users"),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_entityId", ["entityId"])
    .index("by_entityId_period", ["entityId", "period"])
    .index("by_entityId_status", ["entityId", "status"])
    .index("by_entityId_updatedAt", ["entityId", "updatedAt"]),

  budgetIncomeSources: defineTable({
    budgetId: v.id("entityBudgets"),
    entityId: v.id("entities"),
    name: v.string(),
    amountCents: v.number(),
    cadence: budgetPeriodValidator,
    notes: v.optional(v.string()),
    createdByUserId: v.id("users"),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_budgetId", ["budgetId"])
    .index("by_entityId", ["entityId"]),

  budgetRecurringExpenses: defineTable({
    budgetId: v.id("entityBudgets"),
    entityId: v.id("entities"),
    accountId: v.optional(v.id("entityAccounts")),
    categoryId: v.optional(v.id("entityExpenseCategories")),
    name: v.string(),
    amountCents: v.number(),
    cadence: budgetPeriodValidator,
    autoPay: v.optional(v.boolean()),
    category: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdByUserId: v.id("users"),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_budgetId", ["budgetId"])
    .index("by_entityId", ["entityId"])
    .index("by_entityId_category", ["entityId", "category"]),

  budgetUnplannedIncomeSources: defineTable({
    budgetId: v.id("entityBudgets"),
    entityId: v.id("entities"),
    month: v.string(),
    name: v.string(),
    amountCents: v.number(),
    notes: v.optional(v.string()),
    createdByUserId: v.id("users"),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_budgetId_month", ["budgetId", "month"])
    .index("by_entityId_month", ["entityId", "month"]),

  budgetCreditCardReconciliations: defineTable({
    budgetId: v.id("entityBudgets"),
    entityId: v.id("entities"),
    month: v.string(),
    accountId: v.id("entityAccounts"),
    statementBalanceCents: v.number(),
    ledgerBalanceCents: v.number(),
    notes: v.optional(v.string()),
    createdByUserId: v.id("users"),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_budgetId_month", ["budgetId", "month"])
    .index("by_entityId_month", ["entityId", "month"])
    .index("by_budgetId_month_accountId", ["budgetId", "month", "accountId"]),

  entityAccounts: defineTable({
    entityId: v.id("entities"),
    name: v.string(),
    currency: v.string(),
    source: accountSourceValidator,
    institutionId: v.optional(v.id("entityInstitutions")),
    institutionName: v.optional(v.string()),
    plaidAccountId: v.optional(v.string()),
    createdByUserId: v.id("users"),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_entityId", ["entityId"])
    .index("by_entityId_source", ["entityId", "source"]),

  entityInstitutions: defineTable({
    entityId: v.id("entities"),
    name: v.string(),
    normalizedName: v.string(),
    createdByUserId: v.id("users"),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_entityId", ["entityId"])
    .index("by_entityId_normalizedName", ["entityId", "normalizedName"]),

  entityExpenseCategories: defineTable({
    entityId: v.id("entities"),
    name: v.string(),
    normalizedName: v.string(),
    createdByUserId: v.id("users"),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_entityId", ["entityId"])
    .index("by_entityId_normalizedName", ["entityId", "normalizedName"]),

  documents: defineTable({
    entityId: v.id("entities"),
    fileName: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
    storageKey: v.string(),
    cloudFrontUrl: v.optional(v.string()),
    sourceTransactionId: v.optional(v.string()),
    uploadedByUserId: v.id("users"),
    uploadedByEmail: v.string(),
    createdAt: v.string(),
  }).index("by_entityId", ["entityId"]),

  storageConfigurations: defineTable({
    bucket: v.string(),
    region: v.string(),
    cloudFrontDistributionId: v.optional(v.string()),
    cloudFrontDomain: v.optional(v.string()),
    updatedByUserId: v.id("users"),
    updatedAt: v.string(),
  }).index("by_updatedAt", ["updatedAt"]),

  auditEvents: defineTable({
    entityId: v.optional(v.id("entities")),
    actorUserId: v.id("users"),
    actorEmail: v.string(),
    action: v.string(),
    target: v.string(),
    createdAt: v.string(),
    metadata: v.optional(auditMetadataValidator),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_entityId", ["entityId"]),
});
