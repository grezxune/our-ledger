/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts_index from "../accounts/index.js";
import type * as accounts_mutations from "../accounts/mutations.js";
import type * as accounts_queries from "../accounts/queries.js";
import type * as audit_detail from "../audit/detail.js";
import type * as audit_index from "../audit/index.js";
import type * as audit_mutations from "../audit/mutations.js";
import type * as audit_queries from "../audit/queries.js";
import type * as budgets_incomeMutations from "../budgets/incomeMutations.js";
import type * as budgets_index from "../budgets/index.js";
import type * as budgets_math from "../budgets/math.js";
import type * as budgets_mutations from "../budgets/mutations.js";
import type * as budgets_queries from "../budgets/queries.js";
import type * as budgets_removeMutations from "../budgets/removeMutations.js";
import type * as documents_index from "../documents/index.js";
import type * as documents_mutations from "../documents/mutations.js";
import type * as documents_queries from "../documents/queries.js";
import type * as entities_index from "../entities/index.js";
import type * as entities_mappers from "../entities/mappers.js";
import type * as entities_mutations from "../entities/mutations.js";
import type * as entities_queries from "../entities/queries.js";
import type * as entities_types from "../entities/types.js";
import type * as expenseCategories_index from "../expenseCategories/index.js";
import type * as expenseCategories_mutations from "../expenseCategories/mutations.js";
import type * as expenseCategories_queries from "../expenseCategories/queries.js";
import type * as institutions_index from "../institutions/index.js";
import type * as institutions_mutations from "../institutions/mutations.js";
import type * as institutions_queries from "../institutions/queries.js";
import type * as invitations_index from "../invitations/index.js";
import type * as invitations_mutations from "../invitations/mutations.js";
import type * as invitations_queries from "../invitations/queries.js";
import type * as ledger_index from "../ledger/index.js";
import type * as ledger_mutations from "../ledger/mutations.js";
import type * as ledger_queries from "../ledger/queries.js";
import type * as lib_audit from "../lib/audit.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_authFunctions from "../lib/authFunctions.js";
import type * as lib_entityAddress from "../lib/entityAddress.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_time from "../lib/time.js";
import type * as lib_users from "../lib/users.js";
import type * as lib_validators from "../lib/validators.js";
import type * as storage_index from "../storage/index.js";
import type * as storage_mutations from "../storage/mutations.js";
import type * as storage_queries from "../storage/queries.js";
import type * as users_index from "../users/index.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "accounts/index": typeof accounts_index;
  "accounts/mutations": typeof accounts_mutations;
  "accounts/queries": typeof accounts_queries;
  "audit/detail": typeof audit_detail;
  "audit/index": typeof audit_index;
  "audit/mutations": typeof audit_mutations;
  "audit/queries": typeof audit_queries;
  "budgets/incomeMutations": typeof budgets_incomeMutations;
  "budgets/index": typeof budgets_index;
  "budgets/math": typeof budgets_math;
  "budgets/mutations": typeof budgets_mutations;
  "budgets/queries": typeof budgets_queries;
  "budgets/removeMutations": typeof budgets_removeMutations;
  "documents/index": typeof documents_index;
  "documents/mutations": typeof documents_mutations;
  "documents/queries": typeof documents_queries;
  "entities/index": typeof entities_index;
  "entities/mappers": typeof entities_mappers;
  "entities/mutations": typeof entities_mutations;
  "entities/queries": typeof entities_queries;
  "entities/types": typeof entities_types;
  "expenseCategories/index": typeof expenseCategories_index;
  "expenseCategories/mutations": typeof expenseCategories_mutations;
  "expenseCategories/queries": typeof expenseCategories_queries;
  "institutions/index": typeof institutions_index;
  "institutions/mutations": typeof institutions_mutations;
  "institutions/queries": typeof institutions_queries;
  "invitations/index": typeof invitations_index;
  "invitations/mutations": typeof invitations_mutations;
  "invitations/queries": typeof invitations_queries;
  "ledger/index": typeof ledger_index;
  "ledger/mutations": typeof ledger_mutations;
  "ledger/queries": typeof ledger_queries;
  "lib/audit": typeof lib_audit;
  "lib/auth": typeof lib_auth;
  "lib/authFunctions": typeof lib_authFunctions;
  "lib/entityAddress": typeof lib_entityAddress;
  "lib/permissions": typeof lib_permissions;
  "lib/time": typeof lib_time;
  "lib/users": typeof lib_users;
  "lib/validators": typeof lib_validators;
  "storage/index": typeof storage_index;
  "storage/mutations": typeof storage_mutations;
  "storage/queries": typeof storage_queries;
  "users/index": typeof users_index;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
