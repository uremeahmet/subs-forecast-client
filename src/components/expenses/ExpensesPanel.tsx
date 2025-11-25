'use client';

import { useMemo } from 'react';
import type { SharedExpenses, SharedExpenseOverrides } from '@/lib/types';

const sharedExpenseLabels: Record<keyof SharedExpenses, string> = {
  generalAndAdministrative: 'General & Administrative',
  technologyAndDevelopment: 'Technology & Development',
  fulfillmentAndService: 'Fulfillment & Customer Service',
  depreciationAndAmortization: 'Depreciation & Amortization',
};

const monthLabel = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(`${iso}-01`));

interface ExpensesPanelProps {
  months: string[];
  baseExpenses: SharedExpenses | null;
  overrides: SharedExpenseOverrides;
  onBaseChange: (key: keyof SharedExpenses, value: number) => void;
  onOverrideChange: (month: string, key: keyof SharedExpenses, value: number) => void;
  onResetSharedExpenses: () => void;
  onResetMonthOverrides: (month: string) => void;
}

export const ExpensesPanel = ({
  months,
  baseExpenses,
  overrides,
  onBaseChange,
  onOverrideChange,
  onResetSharedExpenses,
  onResetMonthOverrides,
}: ExpensesPanelProps) => {
  const sortedMonths = useMemo(() => [...months], [months]);

  return (
    <section className="mb-8 rounded-2xl border border-white/5 bg-white/5 p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-blue-300">Expenses Control</p>
          <h2 className="text-2xl font-semibold text-white">Shared Operating Expenses</h2>
        </div>
        <button
          type="button"
          onClick={onResetSharedExpenses}
          className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/70 hover:border-blue-400 hover:text-white"
        >
          Reset Shared
        </button>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
        {baseExpenses ? (
          (Object.keys(sharedExpenseLabels) as Array<keyof SharedExpenses>).map((key) => (
            <label key={key} className="flex flex-col gap-2 text-sm text-white/80">
              <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">
                {sharedExpenseLabels[key]}
              </span>
              <input
                type="number"
                step="100"
                min={0}
                value={baseExpenses[key] ?? 0}
                onChange={(event) => onBaseChange(key, Number(event.target.value) || 0)}
                className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white outline-none focus:border-blue-400"
              />
            </label>
          ))
        ) : (
          <p className="text-sm text-white/60">Loading shared expenses…</p>
        )}
      </div>

      <div className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-blue-300">Monthly Overrides</p>
            <h3 className="text-lg font-semibold text-white">Adjust Per-Month Spending</h3>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
          <table className="min-w-full text-left text-sm text-white/80">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-[0.3em] text-white/40">
                <th className="px-4 py-3">Month</th>
                {(Object.keys(sharedExpenseLabels) as Array<keyof SharedExpenses>).map((key) => (
                  <th key={key} className="px-4 py-3">
                    {sharedExpenseLabels[key]}
                  </th>
                ))}
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedMonths.map((month) => {
                const year = month.slice(0, 4);
                const override = overrides[month];
                return (
                  <tr key={month} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 align-middle">
                      <div className="font-semibold text-white">{monthLabel(month)}</div>
                      <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">{year}</div>
                    </td>
                    {(Object.keys(sharedExpenseLabels) as Array<keyof SharedExpenses>).map((key) => {
                      const baseValue = baseExpenses?.[key] ?? 0;
                      const currentValue = override?.[key] ?? baseValue;
                      const isCustom = override?.[key] !== undefined;
                      return (
                        <td key={key} className="px-4 py-3 align-middle">
                          <input
                            type="number"
                            step="100"
                            min={0}
                            value={currentValue}
                            disabled={!baseExpenses}
                            onChange={(event) =>
                              onOverrideChange(month, key, Number(event.target.value) || 0)
                            }
                            className={`w-full rounded-lg border px-3 py-2 text-white outline-none focus:border-emerald-400 ${
                              isCustom ? 'border-emerald-300/60 bg-emerald-500/10' : 'border-white/10 bg-slate-900/40'
                            } ${!baseExpenses ? 'opacity-50' : ''}`}
                          />
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        disabled={!override}
                        onClick={() => onResetMonthOverrides(month)}
                        className="text-xs font-semibold uppercase tracking-wide text-white/70 transition hover:text-white disabled:cursor-not-allowed disabled:text-white/30"
                      >
                        Reset
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

