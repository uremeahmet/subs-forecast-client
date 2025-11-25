'use client';

import { Fragment, useMemo } from 'react';
import type { CohortMatrix } from '@/lib/types';

interface RetentionHeatmapProps {
  cohort?: CohortMatrix;
}

const getCellColor = (value: number) => {
  const clamped = Math.max(0, Math.min(1, value));
  const lightness = 80 - clamped * 35;
  return `hsl(221 83% ${lightness}%)`;
};

export const RetentionHeatmap = ({ cohort }: RetentionHeatmapProps) => {
  const rows = useMemo(() => cohort?.rows ?? [], [cohort]);
  const columnCount = useMemo(
    () => Math.max(0, ...rows.map((row) => row.retention.length)),
    [rows]
  );

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
        No retention data for this project yet.
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-2xl border border-white/5 bg-white/5 p-6">
      <div className="min-w-[600px]">
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `160px repeat(${columnCount}, minmax(0, 1fr))`,
          }}
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-white/50">Cohort</div>
          {Array.from({ length: columnCount }).map((_, index) => (
            <div key={`month-${index}`} className="text-center text-xs font-semibold uppercase tracking-wide text-white/50">
              M{index}
            </div>
          ))}
          {rows.map((row) => (
            <Fragment key={row.cohortStart}>
              <div className="text-xs font-semibold text-white/80">
                {new Date(`${row.cohortStart}-01`).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
              {Array.from({ length: columnCount }).map((_, columnIndex) => {
                const value = row.retention[columnIndex] ?? 0;
                return (
                  <div
                    key={`${row.cohortStart}-${columnIndex}`}
                    className="h-10 rounded-md text-center text-xs font-semibold text-slate-900"
                    style={{ backgroundColor: getCellColor(value) }}
                  >
                    {(value * 100).toFixed(0)}%
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
