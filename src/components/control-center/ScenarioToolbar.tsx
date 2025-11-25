'use client';

import type { ScenarioRecord } from '@/lib/types';
import { cn } from '@/lib/cn';

interface ScenarioToolbarProps {
  scenarios: ScenarioRecord[];
  activeScenarioId: string | null;
  isSaving: boolean;
  scenarioDraft: { name: string; notes: string };
  onSelectScenario: (id: string | null) => void;
  onDraftChange: (field: 'name' | 'notes', value: string) => void;
  onSaveNew: () => void;
  onUpdate: () => void;
}

export const ScenarioToolbar = ({
  scenarios,
  activeScenarioId,
  isSaving,
  scenarioDraft,
  onSelectScenario,
  onDraftChange,
  onSaveNew,
  onUpdate,
}: ScenarioToolbarProps) => {
  return (
    <div className="mb-8 rounded-2xl border border-white/5 bg-white/5 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <label className="text-xs uppercase tracking-[0.3em] text-blue-300">Saved Scenarios</label>
          <select
            value={activeScenarioId ?? ''}
            onChange={(event) => {
              const nextId = event.target.value;
              onSelectScenario(nextId || null);
            }}
            className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
          >
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
            <option value="">Empty Draft</option>
          </select>
        </div>
        <div className="flex flex-1 flex-col gap-2 md:max-w-xl">
          <label className="text-xs uppercase tracking-[0.3em] text-blue-300">Scenario Details</label>
          <div className="flex flex-col gap-2 md:flex-row">
            <input
              type="text"
              placeholder="Scenario name"
              value={scenarioDraft.name}
              onChange={(event) => onDraftChange('name', event.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
            />
            <input
              type="text"
              placeholder="Notes (optional)"
              value={scenarioDraft.notes}
              onChange={(event) => onDraftChange('notes', event.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSaveNew}
            disabled={isSaving}
            className={cn(
              'rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-blue-400 hover:text-white',
              isSaving && 'cursor-not-allowed opacity-60'
            )}
          >
            Save New
          </button>
          <button
            type="button"
            onClick={onUpdate}
            disabled={!activeScenarioId || isSaving}
            className={cn(
              'rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-emerald-400 hover:text-white',
              (!activeScenarioId || isSaving) && 'cursor-not-allowed opacity-60'
            )}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

