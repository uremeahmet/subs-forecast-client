'use client';

import { MonthlyEditor } from './MonthlyEditor';
import type { BlueprintProject, RateOverride } from '@/lib/types';

interface ProjectSidebarProps {
  selectedProject: BlueprintProject | null;
  projectAdjustments?: {
    startingSubscribers?: number;
    pricing?: Partial<BlueprintProject['pricing']>;
    metrics?: Partial<BlueprintProject['metrics']>;
  };
  overrides: Record<string, RateOverride>;
  onOverrideChange: (projectId: string, date: string, field: keyof RateOverride, value: number) => void;
  onResetOverrides: () => void;
  onResetProjectSettings: () => void;
  onSettingChange: (
    projectId: string,
    section: 'startingSubscribers' | 'pricing' | 'metrics',
    key: string,
    value: number
  ) => void;
}

export const ProjectSidebar = ({
  selectedProject,
  projectAdjustments,
  overrides,
  onOverrideChange,
  onResetOverrides,
  onResetProjectSettings,
  onSettingChange,
}: ProjectSidebarProps) => {
  const formatMonthLabel = (month?: string) =>
    month
      ? new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(
          new Date(`${month}-01`)
        )
      : null;

  if (!selectedProject) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
        Select a project to edit settings.
      </div>
    );
  }

  const firstMonth = selectedProject.monthlyData.at(0)?.date;
  const lastMonth = selectedProject.monthlyData.at(-1)?.date;
  const formattedStart = formatMonthLabel(firstMonth);
  const formattedEnd = formatMonthLabel(lastMonth);
  const dateRangeLabel =
    formattedStart && formattedEnd ? `${formattedStart} — ${formattedEnd}` : formattedStart ?? '';

  return (
    <div className="text-white">
      {selectedProject && (
        <div className="mt-8 space-y-6">
          {dateRangeLabel && (
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-[10px] uppercase tracking-[0.4em] text-blue-300">Forecast Range</p>
              <p className="mt-2 text-lg font-semibold text-white">{dateRangeLabel}</p>
              <p className="text-sm text-white/60">Monthly overrides are available throughout this window.</p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-white/60">Project Settings</p>
              <button
                type="button"
                onClick={onResetProjectSettings}
                className="text-xs font-semibold text-blue-300 hover:text-blue-200"
              >
                Reset
              </button>
            </div>
            <div className="mt-3 space-y-3 text-sm">
              <label className="flex flex-col gap-1 text-white/80">
                <span className="text-[10px] uppercase tracking-widest text-white/40">
                  Starting Subscribers
                </span>
                <input
                  type="text"
                  min={0}
                  value={
                    projectAdjustments?.startingSubscribers ?? selectedProject.startingSubscribers
                  }
                  onChange={(event) =>
                    onSettingChange(
                      selectedProject.id,
                      'startingSubscribers',
                      'startingSubscribers',
                      Number(event.target.value)
                    )
                  }
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-blue-400"
                />
              </label>

              <label className="flex flex-col gap-1 text-white/80">
                <span className="text-[10px] uppercase tracking-widest text-white/40">Price ($)</span>
                <input
                  type="text"
                  min={0}
                  step="0.5"
                  value={projectAdjustments?.pricing?.base ?? selectedProject.pricing.base}
                  onChange={(event) =>
                    onSettingChange(selectedProject.id, 'pricing', 'base', Number(event.target.value))
                  }
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-blue-400"
                />
              </label>

              <label className="flex flex-col gap-1 text-white/80">
                <span className="text-[10px] uppercase tracking-widest text-white/40">Cost Ratio (%)</span>
                <input
                  type="text"
                  min={0}
                  max={100}
                  step="0.5"
                  value={((projectAdjustments?.metrics?.cogs ?? selectedProject.metrics.cogs) * 100).toFixed(1)}
                  onChange={(event) =>
                    onSettingChange(
                      selectedProject.id,
                      'metrics',
                      'cogs',
                      Number(event.target.value) / 100
                    )
                  }
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-blue-400"
                />
              </label>

              <label className="flex flex-col gap-1 text-white/80">
                <span className="text-[10px] uppercase tracking-widest text-white/40">Fee Ratio (%)</span>
                <input
                  type="text"
                  min={0}
                  max={100}
                  step="0.1"
                  value={((projectAdjustments?.metrics?.fees ?? selectedProject.metrics.fees) * 100).toFixed(2)}
                  onChange={(event) =>
                    onSettingChange(
                      selectedProject.id,
                      'metrics',
                      'fees',
                      Number(event.target.value) / 100
                    )
                  }
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-blue-400"
                />
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-white/60">Monthly Overrides</p>
              <button
                type="button"
                onClick={onResetOverrides}
                className="text-xs font-semibold text-blue-300 hover:text-blue-200"
              >
                Clear
              </button>
            </div>
            <div className="mt-4">
              <MonthlyEditor
                key={selectedProject.id}
                project={selectedProject}
                overrides={overrides}
                onChange={(date, field, value) => onOverrideChange(selectedProject.id, date, field, value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
