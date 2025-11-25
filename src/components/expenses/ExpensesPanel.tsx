'use client';

import { useMemo, useState } from 'react';
import type { BlueprintProject, OverrideState, SharedExpenses } from '@/lib/types';
import { cn } from '@/lib/cn';

const sharedExpenseLabels: Record<keyof SharedExpenses, string> = {
  generalAndAdministrative: 'General & Administrative',
  technologyAndDevelopment: 'Technology & Development',
  fulfillmentAndService: 'Fulfillment & Customer Service',
  depreciationAndAmortization: 'Depreciation & Amortization',
};

interface ExpensesPanelProps {
  projects: BlueprintProject[];
  overrides: OverrideState;
  sharedExpenses: SharedExpenses | null;
  onSharedExpenseChange: (key: keyof SharedExpenses, value: number) => void;
  onResetSharedExpenses: () => void;
  onSalesMarketingChange: (projectId: string, date: string, value: number) => void;
}

const monthLabel = (date: string) => {
  const [year, month] = date.split('-');
  const iso = `${year}-${month}-01`;
  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(iso));
};

export const ExpensesPanel = ({
  projects,
  overrides,
  sharedExpenses,
  onSharedExpenseChange,
  onResetSharedExpenses,
  onSalesMarketingChange,
}: ExpensesPanelProps) => {
  const [activeProjectId, setActiveProjectId] = useState<string>(projects[0]?.id ?? '');

  const activeProject =
    projects.find((project) => project.id === activeProjectId) ?? projects[0] ?? null;

  const groupedMonths = useMemo(() => {
    if (!activeProject) return {};
    return activeProject.monthlyData.reduce<Record<string, typeof activeProject.monthlyData>>(
      (acc, entry) => {
        const year = entry.date.slice(0, 4);
        if (!acc[year]) acc[year] = [];
        acc[year].push(entry);
        return acc;
      },
      {}
    );
  }, [activeProject]);

  return (
    <section className="mb-8 rounded-2xl border border-white/5 bg-white/5 p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-blue-300">Expenses Control</p>
          <h2 className="text-2xl font-semibold text-white">Operating Expenses</h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onResetSharedExpenses}
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/70 hover:border-blue-400 hover:text-white"
          >
            Reset Shared
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Shared Expenses</h3>
            <p className="text-xs uppercase tracking-wide text-white/50">Monthly Inputs</p>
          </div>
          <div className="space-y-4">
            {sharedExpenses ? (
              (Object.keys(sharedExpenseLabels) as Array<keyof SharedExpenses>).map((key) => (
                <label key={key} className="flex flex-col gap-2 text-sm text-white/80">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">
                    {sharedExpenseLabels[key]}
                  </span>
                  <input
                    type="number"
                    step="100"
                    min={0}
                    value={sharedExpenses[key] ?? 0}
                    onChange={(event) =>
                      onSharedExpenseChange(key, Number(event.target.value) || 0)
                    }
                    className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white outline-none focus:border-blue-400"
                  />
                </label>
              ))
            ) : (
              <p className="text-sm text-white/60">Loading shared expenses…</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">Sales & Marketing</h3>
              <p className="text-xs uppercase tracking-wide text-white/50">
                Per-project monthly overrides
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setActiveProjectId(project.id)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition',
                    activeProject?.id === project.id
                      ? 'border-blue-400 bg-blue-500/20 text-blue-100'
                      : 'border-white/15 text-white/60 hover:border-white/40 hover:text-white'
                  )}
                >
                  {project.name}
                </button>
              ))}
            </div>
          </div>

          {activeProject ? (
            <div className="mt-4 space-y-3">
              {Object.keys(groupedMonths).map((year) => (
                <div key={year} className="rounded-xl border border-white/10">
                  <div className="border-b border-white/5 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70">
                    {year}
                  </div>
                  <div className="divide-y divide-white/5">
                    {groupedMonths[year]?.map((entry) => {
                      const override =
                        overrides[activeProject.id]?.[entry.date]?.salesMarketingExpense;
                      const value = override ?? entry.salesMarketingExpense ?? 0;
                      const isCustom = override !== undefined;
                      return (
                        <div
                          key={entry.date}
                          className="flex items-center gap-4 px-4 py-3 text-sm text-white/80"
                        >
                          <div className="w-20 text-xs uppercase tracking-wide text-white/50">
                            {monthLabel(entry.date)}
                          </div>
                          <input
                            type="number"
                            step="50"
                            min={0}
                            value={value}
                            onChange={(event) =>
                              onSalesMarketingChange(
                                activeProject.id,
                                entry.date,
                                Number(event.target.value) || 0
                              )
                            }
                            className={cn(
                              'flex-1 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-white outline-none focus:border-blue-400',
                              isCustom && 'border-emerald-400 bg-emerald-500/10'
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-white/60">No projects available to edit.</p>
          )}
        </div>
      </div>
    </section>
  );
};

