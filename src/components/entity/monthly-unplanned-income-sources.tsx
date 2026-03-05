"use client";

import { useMemo, useState } from "react";
import { CirclePlus, Trash2 } from "lucide-react";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/action-menu";
import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { InputField } from "@/components/ui/field";
import type { BudgetUnplannedIncomeSource } from "@/lib/domain/types";

interface MonthlyUnplannedIncomeSourcesProps {
  month: string;
  currency: string;
  incomeSources: BudgetUnplannedIncomeSource[];
  addUnplannedIncomeSourceAction: (formData: FormData) => Promise<void>;
  removeUnplannedIncomeSourceAction: (unplannedIncomeSourceId: string) => Promise<void>;
}

function formatCurrency(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amountCents / 100);
}

/**
 * Month-scoped one-off income entries used to adjust planned monthly totals.
 */
export function MonthlyUnplannedIncomeSources({
  month,
  currency,
  incomeSources,
  addUnplannedIncomeSourceAction,
  removeUnplannedIncomeSourceAction,
}: MonthlyUnplannedIncomeSourcesProps) {
  const [pendingDeleteSource, setPendingDeleteSource] = useState<BudgetUnplannedIncomeSource | null>(null);
  const totalUnplannedIncomeCents = useMemo(
    () => incomeSources.reduce((sum, item) => sum + item.amountCents, 0),
    [incomeSources],
  );

  return (
    <section className="rounded-xl border border-line bg-surface/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="font-serif text-lg">Unplanned One-Off Income</h4>
          <p className="text-xs text-foreground/70">{incomeSources.length} source(s) applied to {month}</p>
        </div>
        <p className="text-sm font-medium">{formatCurrency(totalUnplannedIncomeCents, currency)}</p>
      </div>

      {incomeSources.length === 0 ? <p className="mt-3 text-sm text-foreground/70">No unplanned income sources yet.</p> : null}

      {incomeSources.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {incomeSources.map((item) => (
            <li className="rounded-xl border border-line/70 p-3" key={item.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-foreground/75">{formatCurrency(item.amountCents, currency)}</p>
                  {item.notes ? <p className="mt-1 text-xs text-foreground/70">{item.notes}</p> : null}
                </div>
                <ActionMenu
                  items={
                    [
                      {
                        id: `delete-unplanned-${item.id}`,
                        label: "Delete",
                        icon: <Trash2 className="size-4" />,
                        onSelect: () => setPendingDeleteSource(item),
                        tone: "danger",
                      },
                    ] satisfies ActionMenuItem[]
                  }
                  menuAriaLabel={`Unplanned income actions for ${item.name}`}
                  triggerAriaLabel={`Open actions for unplanned income ${item.name}`}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <form action={addUnplannedIncomeSourceAction} className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_12rem_minmax(0,1fr)_auto]">
        <input name="month" type="hidden" value={month} />
        <InputField autoComplete="off" label="Income source" name="name" placeholder="Tax refund" required />
        <InputField label="Amount" min="0.01" name="amount" placeholder="0.00" required step="0.01" type="number" />
        <InputField autoComplete="off" label="Notes" name="notes" placeholder="Optional" />
        <div className="flex items-end lg:justify-end">
          <Button ariaLabel="Add unplanned income source" startIcon={<CirclePlus className="size-4" />} type="submit">
            Add source
          </Button>
        </div>
      </form>

      <ConfirmationModal
        confirmFormAction={
          pendingDeleteSource ? removeUnplannedIncomeSourceAction.bind(null, pendingDeleteSource.id) : undefined
        }
        confirmIcon={<Trash2 className="size-4" />}
        confirmLabel="Delete unplanned income"
        description={
          pendingDeleteSource
            ? `This removes "${pendingDeleteSource.name}" from this month.`
            : "This removes this income source from this month."
        }
        onClose={() => setPendingDeleteSource(null)}
        open={Boolean(pendingDeleteSource)}
        title="Delete unplanned income?"
      />
    </section>
  );
}
