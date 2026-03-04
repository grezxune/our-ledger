"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { CirclePlus, Save, X } from "lucide-react";
import { AddAccountModal } from "@/components/entity/add-account-modal";
import { Button } from "@/components/ui/button";
import { InputField, SelectField } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { BUDGET_PERIOD_OPTIONS } from "@/lib/domain/options";
import {
  ADD_ACCOUNT_OPTION,
  ADD_EXPENSE_CATEGORY_OPTION,
  buildNamedEntityOptions,
  hasRealSelection,
} from "@/lib/domain/expense-form";
import type { EntityAccount } from "@/lib/domain/types";

interface NamedEntityOption {
  id: string;
  name: string;
}

interface AccountOption {
  id: string;
  name: string;
  source: "manual" | "plaid";
}

interface RecurringExpensePlannerProps {
  accounts: EntityAccount[];
  institutions: NamedEntityOption[];
  expenseCategories: NamedEntityOption[];
  entityCurrency: string;
  addRecurringExpenseAction: (formData: FormData) => Promise<void>;
  createAccountAction: (formData: FormData) => Promise<AccountOption>;
  createInstitutionAction: (formData: FormData) => Promise<NamedEntityOption>;
  createExpenseCategoryAction: (formData: FormData) => Promise<NamedEntityOption>;
}

/**
 * Recurring expense form with managed paid-from account and category collections.
 */
export function RecurringExpensePlanner({
  accounts,
  institutions,
  expenseCategories,
  entityCurrency,
  addRecurringExpenseAction,
  createAccountAction,
  createInstitutionAction,
  createExpenseCategoryAction,
}: RecurringExpensePlannerProps) {
  const [managedAccounts, setManagedAccounts] = useState<AccountOption[]>(
    accounts.map((account) => ({ id: account.id, name: account.name, source: account.source })),
  );
  const [managedInstitutions, setManagedInstitutions] = useState<NamedEntityOption[]>(institutions);
  const [managedCategories, setManagedCategories] = useState<NamedEntityOption[]>(expenseCategories);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(managedAccounts[0]?.id || "");
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    managedCategories[0]?.id || ADD_EXPENSE_CATEGORY_OPTION,
  );
  const [categoryError, setCategoryError] = useState<string | null>(null);

  useEffect(() => {
    setManagedAccounts(accounts.map((account) => ({ id: account.id, name: account.name, source: account.source })));
  }, [accounts]);

  useEffect(() => {
    setManagedInstitutions(institutions);
  }, [institutions]);

  useEffect(() => {
    setManagedCategories(expenseCategories);
  }, [expenseCategories]);

  useEffect(() => {
    if (managedAccounts.some((account) => account.id === selectedAccountId)) {
      return;
    }

    setSelectedAccountId(managedAccounts[0]?.id || ADD_ACCOUNT_OPTION);
  }, [managedAccounts, selectedAccountId]);

  useEffect(() => {
    if (managedCategories.some((category) => category.id === selectedCategoryId)) {
      return;
    }

    setSelectedCategoryId(managedCategories[0]?.id || ADD_EXPENSE_CATEGORY_OPTION);
  }, [managedCategories, selectedCategoryId]);

  function upsertNamedOption(
    collection: NamedEntityOption[],
    item: NamedEntityOption,
  ): NamedEntityOption[] {
    const existingIndex = collection.findIndex((entry) => entry.id === item.id);
    if (existingIndex === -1) {
      return [...collection, item];
    }

    const updated = [...collection];
    updated[existingIndex] = item;
    return updated;
  }

  function upsertAccount(collection: AccountOption[], item: AccountOption): AccountOption[] {
    const existingIndex = collection.findIndex((entry) => entry.id === item.id);
    if (existingIndex === -1) {
      return [...collection, item];
    }

    const updated = [...collection];
    updated[existingIndex] = item;
    return updated;
  }

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCategoryError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const category = await createExpenseCategoryAction(formData);
      setManagedCategories((current) => upsertNamedOption(current, category));
      setSelectedCategoryId(category.id);
      setIsCategoryModalOpen(false);
      form.reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save category.";
      setCategoryError(message);
    }
  }

  const accountOptions = useMemo(
    () =>
      managedAccounts.length === 0
        ? [{ label: "Add account to continue", value: ADD_ACCOUNT_OPTION }]
        : [
            ...managedAccounts.map((account) => ({
              label: `${account.name} (${account.source === "plaid" ? "Plaid" : "Manual"})`,
              value: account.id,
            })),
            { label: "Add Account", value: ADD_ACCOUNT_OPTION },
          ],
    [managedAccounts],
  );
  const categoryOptions = useMemo(
    () =>
      buildNamedEntityOptions(
        managedCategories,
        "Add category to continue",
        ADD_EXPENSE_CATEGORY_OPTION,
        "Add Category",
      ),
    [managedCategories],
  );
  const hasRealAccount = hasRealSelection(managedAccounts.length, selectedAccountId, ADD_ACCOUNT_OPTION);
  const hasRealCategory = hasRealSelection(
    managedCategories.length,
    selectedCategoryId,
    ADD_EXPENSE_CATEGORY_OPTION,
  );
  const inlineInputClass =
    "h-8 border-0 border-b border-line/60 bg-transparent px-0 py-0 leading-5 ring-0 focus:border-b-accent focus:ring-0 focus-visible:ring-0";
  const inlineSelectClass =
    "flex h-8 items-center border-0 border-b border-line/60 bg-transparent px-0 py-0 pr-7 leading-5 ring-0 focus:border-b-accent focus:ring-0 focus-visible:ring-0";

  return (
    <>
      <form action={addRecurringExpenseAction} className="mt-3 grid gap-2 md:hidden">
        <InputField autoComplete="off" label="Expense name" name="name" placeholder="Expense name" required />
        <div className="grid gap-2 sm:grid-cols-2">
          <SelectField
            label="Expense category"
            name="categoryId"
            onChange={(event) => {
              const value = event.target.value;
              setSelectedCategoryId(value);
              if (value === ADD_EXPENSE_CATEGORY_OPTION) setIsCategoryModalOpen(true);
            }}
            options={categoryOptions}
            required
            value={selectedCategoryId}
          />
          <SelectField
            defaultValue="monthly"
            label="Cadence"
            name="cadence"
            options={[...BUDGET_PERIOD_OPTIONS]}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <SelectField
            label="Paid from account"
            name="accountId"
            onChange={(event) => {
              const value = event.target.value;
              setSelectedAccountId(value);
              if (value === ADD_ACCOUNT_OPTION) setIsAccountModalOpen(true);
            }}
            options={accountOptions}
            required
            value={selectedAccountId}
          />
          <InputField
            label="Expense amount"
            min="0.01"
            name="amount"
            placeholder="0.00"
            required
            step="0.01"
            type="number"
          />
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground/90">
          <input
            className="size-4 rounded border border-line bg-surface accent-accent"
            name="autoPay"
            type="checkbox"
          />
          <span>Auto Pay</span>
        </label>
        <InputField label="Notes" name="notes" placeholder="Notes (optional)" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-foreground/75">
            {managedAccounts.length === 0 ? "No accounts yet. Select Add Account in the account field to create one." : ""}
            {!hasRealCategory ? " Select a category to enable save." : ""}
            {!hasRealAccount ? " Select an account to enable save." : ""}
          </p>
          <Button
            ariaLabel="Add recurring expense"
            disabled={!hasRealAccount || !hasRealCategory}
            startIcon={<CirclePlus className="size-4" />}
            type="submit"
          >
            Add recurring expense
          </Button>
        </div>
      </form>

      <form action={addRecurringExpenseAction} className="hidden" id="add-recurring-expense-form" />

      <div className="mt-2 hidden md:block">
        <table className="w-full table-fixed text-sm">
          <tbody>
            <tr className="border-t border-line/50 align-top">
              <td className="w-[25%] px-1 py-1.5">
                <InputField
                  autoComplete="off"
                  className={inlineInputClass}
                  cornerStyle="none"
                  form="add-recurring-expense-form"
                  label="Expense name"
                  labelHidden
                  name="name"
                  placeholder="Expense name"
                  required
                />
              </td>
              <td className="w-[20%] px-1 py-1.5">
                <SelectField
                  className={inlineSelectClass}
                  cornerStyle="none"
                  form="add-recurring-expense-form"
                  label="Expense category"
                  labelHidden
                  name="categoryId"
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedCategoryId(value);
                    if (value === ADD_EXPENSE_CATEGORY_OPTION) setIsCategoryModalOpen(true);
                  }}
                  options={categoryOptions}
                  required
                  value={selectedCategoryId}
                />
              </td>
              <td className="w-[20%] px-1 py-1.5">
                <SelectField
                  className={inlineSelectClass}
                  cornerStyle="none"
                  form="add-recurring-expense-form"
                  label="Paid from account"
                  labelHidden
                  name="accountId"
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedAccountId(value);
                    if (value === ADD_ACCOUNT_OPTION) setIsAccountModalOpen(true);
                  }}
                  options={accountOptions}
                  required
                  value={selectedAccountId}
                />
              </td>
              <td className="w-[12%] px-1 py-1.5">
                <InputField
                  className={inlineInputClass}
                  cornerStyle="none"
                  form="add-recurring-expense-form"
                  label="Expense amount"
                  labelHidden
                  min="0.01"
                  name="amount"
                  placeholder="0.00"
                  required
                  step="0.01"
                  type="number"
                />
              </td>
              <td className="w-[12%] px-1 py-1.5">
                <SelectField
                  className={inlineSelectClass}
                  cornerStyle="none"
                  defaultValue="monthly"
                  form="add-recurring-expense-form"
                  label="Expense cadence"
                  labelHidden
                  name="cadence"
                  options={[...BUDGET_PERIOD_OPTIONS]}
                />
              </td>
              <td className="w-[10%] px-1 py-1.5">
                <label className="inline-flex h-8 items-center gap-2 text-xs font-medium text-foreground/85">
                  <input
                    className="size-4 rounded border border-line bg-surface accent-accent"
                    form="add-recurring-expense-form"
                    name="autoPay"
                    type="checkbox"
                  />
                  <span>Auto Pay</span>
                </label>
              </td>
              <td className="w-10 px-1 py-1.5 pr-0">
                <div className="flex justify-end">
                  <Button
                    ariaLabel="Add recurring expense"
                    disabled={!hasRealAccount || !hasRealCategory}
                    form="add-recurring-expense-form"
                    iconOnly
                    startIcon={<CirclePlus className="size-4" />}
                    type="submit"
                  >
                    <span className="sr-only">Add recurring expense</span>
                  </Button>
                </div>
              </td>
            </tr>
            <tr className="border-b border-line/50">
              <td className="px-1 pb-1.5" colSpan={7}>
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <InputField
                    className={`${inlineInputClass} text-xs`}
                    cornerStyle="none"
                    form="add-recurring-expense-form"
                    label="Expense notes"
                    labelHidden
                    name="notes"
                    placeholder="Notes (optional)"
                  />
                  <div className="text-right text-xs text-foreground/75">
                    {managedAccounts.length === 0 ? "No accounts yet. Select Add Account in the account field to create one." : ""}
                    {!hasRealCategory ? " Select a category to enable save." : ""}
                    {!hasRealAccount ? " Select an account to enable save." : ""}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Modal
        onClose={() => {
          setCategoryError(null);
          setIsCategoryModalOpen(false);
        }}
        open={isCategoryModalOpen}
        title="Add Expense Category"
      >
        <form className="grid gap-3" onSubmit={handleCategorySubmit}>
          <InputField label="Category Name" name="name" required />
          {categoryError ? <p className="text-sm text-red-500">{categoryError}</p> : null}
          <div className="flex gap-2">
            <Button ariaLabel="Save expense category" startIcon={<Save className="size-4" />} type="submit">
              Save Category
            </Button>
            <Button
              ariaLabel="Cancel category creation"
              onClick={() => {
                setCategoryError(null);
                setIsCategoryModalOpen(false);
              }}
              startIcon={<X className="size-4" />}
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <AddAccountModal
        createAccountAction={createAccountAction}
        createInstitutionAction={createInstitutionAction}
        entityCurrency={entityCurrency}
        institutions={managedInstitutions}
        onAccountCreated={(account) => {
          setManagedAccounts((current) => upsertAccount(current, account));
          setSelectedAccountId(account.id);
        }}
        onClose={() => setIsAccountModalOpen(false)}
        onInstitutionCreated={(institution) => {
          setManagedInstitutions((current) => upsertNamedOption(current, institution));
        }}
        open={isAccountModalOpen}
      />
    </>
  );
}
