import type { GenericValidator, ObjectType, PropertyValidators } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { requireAuthIdentity, requireAuthenticatedUserId, requirePremium, requireSuperAdminByUserId } from "./auth";

type UserScopedArgValidators = PropertyValidators & {
  userId: GenericValidator;
};

interface QueryDefinition<ArgsValidator extends PropertyValidators, Result> {
  args: ArgsValidator;
  handler: (ctx: QueryCtx, args: ObjectType<ArgsValidator>) => Promise<Result> | Result;
}

interface MutationDefinition<ArgsValidator extends PropertyValidators, Result> {
  args: ArgsValidator;
  handler: (ctx: MutationCtx, args: ObjectType<ArgsValidator>) => Promise<Result> | Result;
}

export function authenticatedQuery<ArgsValidator extends UserScopedArgValidators, Result>(
  definition: QueryDefinition<ArgsValidator, Result>,
) {
  return query({
    args: definition.args as never,
    handler: (async (ctx: QueryCtx, args: ObjectType<ArgsValidator>) => {
      const userArgs = args as ObjectType<ArgsValidator> & { userId: Id<"users"> };
      await requireAuthenticatedUserId(ctx, userArgs.userId);
      return definition.handler(ctx, args);
    }) as never,
  } as never);
}

export function authenticatedMutation<ArgsValidator extends UserScopedArgValidators, Result>(
  definition: MutationDefinition<ArgsValidator, Result>,
) {
  return mutation({
    args: definition.args as never,
    handler: (async (ctx: MutationCtx, args: ObjectType<ArgsValidator>) => {
      const userArgs = args as ObjectType<ArgsValidator> & { userId: Id<"users"> };
      await requireAuthenticatedUserId(ctx, userArgs.userId);
      return definition.handler(ctx, args);
    }) as never,
  } as never);
}

export function authenticatedIdentityQuery<ArgsValidator extends PropertyValidators, Result>(
  definition: QueryDefinition<ArgsValidator, Result>,
) {
  return query({
    args: definition.args as never,
    handler: (async (ctx: QueryCtx, args: ObjectType<ArgsValidator>) => {
      await requireAuthIdentity(ctx);
      return definition.handler(ctx, args);
    }) as never,
  } as never);
}

export function authenticatedIdentityMutation<ArgsValidator extends PropertyValidators, Result>(
  definition: MutationDefinition<ArgsValidator, Result>,
) {
  return mutation({
    args: definition.args as never,
    handler: (async (ctx: MutationCtx, args: ObjectType<ArgsValidator>) => {
      await requireAuthIdentity(ctx);
      return definition.handler(ctx, args);
    }) as never,
  } as never);
}

export function superAdminQuery<ArgsValidator extends UserScopedArgValidators, Result>(
  definition: QueryDefinition<ArgsValidator, Result>,
) {
  return query({
    args: definition.args as never,
    handler: (async (ctx: QueryCtx, args: ObjectType<ArgsValidator>) => {
      const userArgs = args as ObjectType<ArgsValidator> & { userId: Id<"users"> };
      await requireSuperAdminByUserId(ctx, userArgs.userId);
      return definition.handler(ctx, args);
    }) as never,
  } as never);
}

export function superAdminMutation<ArgsValidator extends UserScopedArgValidators, Result>(
  definition: MutationDefinition<ArgsValidator, Result>,
) {
  return mutation({
    args: definition.args as never,
    handler: (async (ctx: MutationCtx, args: ObjectType<ArgsValidator>) => {
      const userArgs = args as ObjectType<ArgsValidator> & { userId: Id<"users"> };
      await requireSuperAdminByUserId(ctx, userArgs.userId);
      return definition.handler(ctx, args);
    }) as never,
  } as never);
}

export function superAdminIdentityQuery<ArgsValidator extends PropertyValidators, Result>(
  definition: QueryDefinition<ArgsValidator, Result>,
) {
  return query({
    args: definition.args as never,
    handler: (async (ctx: QueryCtx, args: ObjectType<ArgsValidator>) => {
      await requirePremium(ctx);
      return definition.handler(ctx, args);
    }) as never,
  } as never);
}

export function superAdminIdentityMutation<ArgsValidator extends PropertyValidators, Result>(
  definition: MutationDefinition<ArgsValidator, Result>,
) {
  return mutation({
    args: definition.args as never,
    handler: (async (ctx: MutationCtx, args: ObjectType<ArgsValidator>) => {
      await requirePremium(ctx);
      return definition.handler(ctx, args);
    }) as never,
  } as never);
}
