'use client';

import { useMemo, useState } from 'react';
import type { BlueprintProject, RateOverride } from '@/lib/types';
import { cn } from '@/lib/cn';

interface MonthlyEditorProps {
  project: BlueprintProject;
  overrides: Record<string, RateOverride>;
  onChange: (date: string, field: keyof RateOverride, value: number) => void;
}

const monthLabel = (date: string) => {
  const [year, month] = date.split('-');
  const iso = `${year}-${month}-01`;
  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(iso));
};

export const MonthlyEditor = ({ project, overrides, onChange }: MonthlyEditorProps) => {
  const [openYear, setOpenYear] = useState<string>('2026');

  const grouped = useMemo(() => {
    return project.monthlyData.reduce<Record<string, typeof project.monthlyData>>((acc, entry) => {
      const year = entry.date.slice(0, 4);
      if (!acc[year]) acc[year] = [];
      acc[year].push(entry);
      return acc;
    }, {});
  }, [project]);

  const years = Object.keys(grouped).sort();

  return (
    <div className="space-y-4">
      {years.map((year) => (
        <div key={year} className="rounded-xl border border-white/5 bg-white/5">
          <button
            type="button"
            onClick={() => setOpenYear((prev) => (prev === year ? '' : year))}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-white/80"
          >
            <span>{year}</span>
            <span className="text-xs uppercase tracking-wide text-blue-300">
              {openYear === year ? 'Hide Months' : 'Show Months'}
            </span>
          </button>
          {openYear === year && (
            <div className="divide-y divide-white/5">
              {grouped[year].map((entry) => {
                const override = overrides[entry.date];
                const finalGrowth = (override?.growth ?? entry.growthRate) * 100;
                const finalChurn = (override?.churn ?? entry.churnRate) * 100;
                const isGrowthCustom = override?.growth !== undefined;
                const isChurnCustom = override?.churn !== undefined;
                return (
                  <div
                    key={entry.date}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-white/90"
                  >
                    <div className="w-16 text-xs uppercase tracking-wide text-white/60">
                      {monthLabel(entry.date)}
                    </div>
                    <label className="flex flex-1 flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-widest text-white/40">
                        Growth %
                      </span>
                      <input
                        type="number"
                        step="0.1"
                        value={finalGrowth.toFixed(1)}
                        onChange={(event) =>
                          onChange(entry.date, 'growth', Number(event.target.value) / 100)
                        }
                        className={cn(
                          'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-blue-400',
                          isGrowthCustom && 'border-blue-400/80 bg-blue-500/10'
                        )}
                      />
                    </label>
                    <label className="flex flex-1 flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-widest text-white/40">
                        Churn %
                      </span>
                      <input
                        type="number"
                        step="0.1"
                        value={finalChurn.toFixed(1)}
                        onChange={(event) =>
                          onChange(entry.date, 'churn', Number(event.target.value) / 100)
                        }
                        className={cn(
                          'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-red-400',
                          isChurnCustom && 'border-red-400/80 bg-red-500/10'
                        )}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
