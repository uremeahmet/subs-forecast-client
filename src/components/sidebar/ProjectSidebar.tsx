'use client';

import { MonthlyEditor } from './MonthlyEditor';
import type { BlueprintProject, RateOverride } from '@/lib/types';
import { cn } from '@/lib/cn';

interface ProjectSidebarProps {
  projects: BlueprintProject[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
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
  projects,
  selectedProjectId,
  onSelectProject,
  selectedProject,
  projectAdjustments,
  overrides,
  onOverrideChange,
  onResetOverrides,
  onResetProjectSettings,
  onSettingChange,
}: ProjectSidebarProps) => {
  return (
    <aside className="w-[360px] shrink-0 border-r border-white/5 bg-slate-950/70 p-6 text-white">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-300">Projects</p>
        <h2 className="text-2xl font-semibold text-white">Control Center</h2>
      </div>

      <div className="space-y-3">
        {projects.map((project) => {
          const isActive = project.id === selectedProjectId;
          return (
            <button
              key={project.id}
              type="button"
              onClick={() => onSelectProject(project.id)}
              className={cn(
                'w-full rounded-2xl border border-white/5 bg-white/5 p-4 text-left transition hover:border-blue-400/60 hover:bg-white/10',
                isActive && 'border-blue-400 bg-blue-500/10'
              )}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">{project.id}</p>
              <h3 className="text-lg font-semibold text-white">{project.name}</h3>
              <p className="text-sm text-white/60">{project.description}</p>
            </button>
          );
        })}
      </div>

      {selectedProject && (
        <div className="mt-8 space-y-6">
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
                  type="number"
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
                  type="number"
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
                  type="number"
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
                  type="number"
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
                project={selectedProject}
                overrides={overrides}
                onChange={(date, field, value) => onOverrideChange(selectedProject.id, date, field, value)}
              />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
