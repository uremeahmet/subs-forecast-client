'use client';

import { FormEvent, useMemo, useState } from 'react';
import { ProjectSidebar } from '@/components/sidebar/ProjectSidebar';
import { useForecastSimulation } from '@/hooks/useForecastSimulation';
import { KpiGrid } from '@/components/control-center/KpiGrid';
import { ArrAreaChart, MrrAreaChart, ActiveSubscriptionsAreaChart } from '@/components/charts/MrrAreaChart';
import { GrowthBreakdownChart } from '@/components/charts/GrowthBreakdownChart';
import { ScenarioToolbar } from '@/components/control-center/ScenarioToolbar';
import { ExpensesPanel } from '@/components/expenses/ExpensesPanel';
import { ProfitabilityCharts } from '@/components/charts/ProfitabilityCharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { formatCurrency, formatNumber } from '@/lib/format';

export default function HomePage() {
  const [activePanel, setActivePanel] = useState<
    'overview' | 'project-settings' | 'expenses-input' | 'expenses-analytics'
  >('overview');
  const [newProjectName, setNewProjectName] = useState('');
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const {
    blueprint,
    simulation,
    isLoading,
    isSimulating,
    error,
    selectedProjectId,
    setSelectedProjectId,
    selectedProjectIds,
    toggleProjectSelection,
    setProjectFilters,
    updateMonthlyOverride,
    updateProjectSetting,
    resetOverrides,
    resetProjectSettings,
    overrides,
    projectSettings,
    sharedExpenseBase,
    sharedExpenseOverrides,
    updateSharedExpenseBase,
    updateSharedExpenseOverride,
    clearSharedExpenseOverridesForMonth,
    resetSharedExpenseInputs,
    selectedProject,
    refresh,
    scenarios,
    activeScenarioId,
    selectScenario,
    scenarioDraft,
    updateScenarioDraft,
    persistScenario,
    isSavingScenario,
    addProject,
    removeProject,
    isProjectMutating,
  } = useForecastSimulation();

  const handleCreateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = newProjectName.trim();
    if (!trimmed) {
      return;
    }
    await addProject(trimmed);
    setNewProjectName('');
  };

  const months = simulation?.metadata.months ?? [];
  const defaultRangeStart = months[0] ?? '';
  const defaultRangeEnd = months[months.length - 1] ?? '';
  const safeRangeStart =
    rangeStart && months.includes(rangeStart) ? rangeStart : defaultRangeStart;
  const safeRangeEnd = rangeEnd && months.includes(rangeEnd) ? rangeEnd : defaultRangeEnd;

  const filteredTimeseries = useMemo(() => {
    if (!simulation || !safeRangeStart || !safeRangeEnd) {
      return simulation?.timeseries ?? [];
    }
    return simulation.timeseries.filter(
      (point) => point.date >= safeRangeStart && point.date <= safeRangeEnd
    );
  }, [simulation, safeRangeStart, safeRangeEnd]);

  if (isLoading || !blueprint || !simulation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-blue-300">Booting</p>
          <p className="mt-4 text-3xl font-semibold text-white">Loading Forecast Workspace…</p>
        </div>
      </div>
    );
  }

  const visibleTimeseries = filteredTimeseries.length ? filteredTimeseries : simulation.timeseries;

  const latestTotals = visibleTimeseries.at(-1)?.totals ?? null;
  const previousTotals = visibleTimeseries.at(-2)?.totals ?? null;
  const selectedOverrides = selectedProjectId ? overrides[selectedProjectId] ?? {} : {};
  const selectedAdjustments = selectedProjectId ? projectSettings[selectedProjectId] : undefined;
  const formatMonthLabel = (month?: string) =>
    month
      ? new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(
          new Date(`${month}-01`)
        )
      : '';
  const forecastRangeLabel = [
    formatMonthLabel(simulation.metadata.months[0]),
    formatMonthLabel(simulation.metadata.months.at(-1)),
  ]
    .filter(Boolean)
    .join(' — ');

  const selectedRangeLabel =
    safeRangeStart && safeRangeEnd
      ? [formatMonthLabel(safeRangeStart), formatMonthLabel(safeRangeEnd)]
          .filter(Boolean)
          .join(' — ')
      : '';

  const handleRangeChange = (type: 'start' | 'end', value: string) => {
    if (!value) {
      return;
    }
    if (type === 'start') {
      setRangeStart(value);
      if (rangeEnd && value > rangeEnd) {
        setRangeEnd(value);
      }
    } else {
      setRangeEnd(value);
      if (rangeStart && rangeStart > value) {
        setRangeStart(value);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-blue-300">Live Forecast</p>
            <h1 className="text-3xl font-semibold">SaaS Control Center</h1>
            <p className="text-sm text-white/60">
              {simulation.metadata.months[0]} — {simulation.metadata.months.at(-1)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                isSimulating ? 'bg-yellow-500/20 text-yellow-100' : 'bg-emerald-500/20 text-emerald-100'
              )}
            >
              {isSimulating ? 'Recalculating' : 'Synced'}
            </span>
            <button
              type="button"
              onClick={refresh}
              className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 hover:border-white/60"
            >
              Refresh
            </button>
          </div>
        </header>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'project-settings', label: 'Project Settings' },
            { key: 'expenses-input', label: 'Expenses Input' },
            { key: 'expenses-analytics', label: 'Expenses Analytics' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() =>
                setActivePanel(
                  tab.key as
                    | 'overview'
                    | 'project-settings'
                    | 'expenses-input'
                    | 'expenses-analytics'
                )
              }
              className={cn(
                'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition',
                activePanel === tab.key
                  ? 'border-blue-400 bg-blue-500/20'
                  : 'border-white/20 text-white/70 hover:border-white/60'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <ScenarioToolbar
          scenarios={scenarios}
          activeScenarioId={activeScenarioId}
          isSaving={isSavingScenario}
          scenarioDraft={scenarioDraft}
          onSelectScenario={selectScenario}
          onDraftChange={updateScenarioDraft}
          onSaveNew={() => persistScenario()}
          onUpdate={() => persistScenario({ id: activeScenarioId ?? undefined })}
        />

        {safeRangeStart && safeRangeEnd && (
          <section className="mb-6 rounded-2xl border border-white/5 bg-white/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-blue-300">Date Range</p>
                <p className="text-lg font-semibold text-white">
                  {selectedRangeLabel || 'Select range'}
                </p>
                <p className="text-sm text-white/60">
                  All reports below reflect this window.
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-4">
                <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-white/60">
                  <span>From</span>
                  <select
                    value={safeRangeStart}
                    onChange={(event) => handleRangeChange('start', event.target.value)}
                    className="mt-1 rounded-lg border border-white/20 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                  >
                    {simulation.metadata.months.map((month) => (
                      <option key={month} value={month}>
                        {formatMonthLabel(month) ?? month}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-white/60">
                  <span>To</span>
                  <select
                    value={safeRangeEnd}
                    onChange={(event) => handleRangeChange('end', event.target.value)}
                    className="mt-1 rounded-lg border border-white/20 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                  >
                    {simulation.metadata.months.map((month) => (
                      <option key={month} value={month}>
                        {formatMonthLabel(month) ?? month}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </section>
        )}

        {activePanel === 'project-settings' && (
          <div className="mb-8 rounded-2xl border border-white/5 bg-white/5 p-4">
            <div className="mb-6 rounded-xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-[10px] uppercase tracking-[0.4em] text-blue-300">Forecast Range</p>
              <p className="mt-2 text-lg font-semibold text-white">{forecastRangeLabel}</p>
              <p className="text-sm text-white/60">
                Monthly overrides and project settings apply across this window.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              <aside className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-blue-300">Projects</p>
                <div className="mt-3 space-y-2">
                  {blueprint.projects.map((project) => (
                    <div key={project.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedProjectId(project.id)}
                        className={cn(
                          'flex-1 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition',
                          selectedProjectId === project.id
                            ? 'border-blue-400 bg-blue-500/10 text-white'
                            : 'border-white/10 text-white/70 hover:border-white/40 hover:text-white'
                        )}
                      >
                        <div className="uppercase text-[10px] tracking-[0.3em] text-white/40">
                          {project.id}
                        </div>
                        <div>{project.name}</div>
                      </button>
                      <button
                        type="button"
                        disabled={blueprint.projects.length <= 1 || isProjectMutating}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (
                            blueprint.projects.length <= 1 ||
                            !window.confirm(`Delete project "${project.name}"?`)
                          ) {
                            return;
                          }
                          void removeProject(project.id);
                        }}
                        className="rounded-lg border border-red-500/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                  <form onSubmit={handleCreateProject} className="mt-4 flex gap-2">
                    <input
                      type="text"
                      placeholder="New project name"
                      value={newProjectName}
                      onChange={(event) => setNewProjectName(event.target.value)}
                      className="flex-1 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                    />
                    <button
                      type="submit"
                      disabled={!newProjectName.trim() || isProjectMutating}
                      className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/70 transition hover:border-blue-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Add
                    </button>
                  </form>
                </div>
              </aside>
              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                <ProjectSidebar
                  selectedProject={selectedProject}
                  projectAdjustments={selectedAdjustments}
                  overrides={selectedOverrides}
                  onOverrideChange={(projectId, date, field, value) =>
                    updateMonthlyOverride(projectId, date, field, value)
                  }
                  onResetOverrides={() => selectedProjectId && resetOverrides(selectedProjectId)}
                  onResetProjectSettings={() =>
                    selectedProjectId && resetProjectSettings(selectedProjectId)
                  }
                  onSettingChange={(projectId, section, key, value) =>
                    updateProjectSetting(projectId, section, key, value)
                  }
                />
              </div>
            </div>
          </div>
        )}

        {activePanel === 'expenses-input' && simulation && (
          <ExpensesPanel
            months={simulation.metadata.months}
            baseExpenses={sharedExpenseBase}
            overrides={sharedExpenseOverrides}
            onBaseChange={updateSharedExpenseBase}
            onOverrideChange={updateSharedExpenseOverride}
            onResetSharedExpenses={resetSharedExpenseInputs}
            onResetMonthOverrides={clearSharedExpenseOverridesForMonth}
          />
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        {(activePanel === 'overview' || activePanel === 'expenses-analytics') && (
          <section className="mb-8 rounded-2xl border border-white/5 bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.4em] text-blue-300">Compare Plans</p>
              <button
                type="button"
                onClick={() => setProjectFilters(blueprint.projects.map((project) => project.id))}
                className="text-xs font-semibold uppercase tracking-wide text-white/70 hover:text-white"
              >
                Select All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {blueprint.projects.map((project) => {
                const active = selectedProjectIds.includes(project.id);
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => toggleProjectSelection(project.id)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition',
                      active
                        ? 'border-blue-400 bg-blue-500/20 text-blue-100'
                        : 'border-white/20 bg-transparent text-white/70 hover:border-white/60'
                    )}
                  >
                    {project.name}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {(activePanel === 'overview' || activePanel === 'expenses-analytics') && (
          <>
            {activePanel === 'overview' && (
              <div className="space-y-8">
                <KpiGrid
                  summary={null}
                  latest={latestTotals}
                  previous={previousTotals}
                  timeseries={visibleTimeseries}
                />

                <div className="grid gap-6 xl:grid-cols-2">
                  <Card>
                    <CardHeader className="flex items-center justify-between">
                      <div>
                        <CardTitle>MRR Area Forecast</CardTitle>
                        <p className="text-sm text-white/60">Stacked spline view per project</p>
                      </div>
                      <div className="text-right text-sm text-white/60">
                        <p>Total MRR</p>
                        <p className="text-xl font-semibold text-white">
                          {formatCurrency(latestTotals?.mrr ?? 0)}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <MrrAreaChart
                        timeseries={visibleTimeseries}
                        selectedProjectIds={selectedProjectIds}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Growth vs Churn</CardTitle>
                      <p className="text-sm text-white/60">Positive vs negative MRR drivers</p>
                    </CardHeader>
                    <CardContent>
                      <GrowthBreakdownChart timeseries={visibleTimeseries} />
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <Card>
                    <CardHeader className="flex items-center justify-between">
                      <div>
                        <CardTitle>Active Subscriptions</CardTitle>
                        <p className="text-sm text-white/60">Stacked projections per project</p>
                      </div>
                      <div className="text-right text-sm text-white/60">
                        <p>Total Active Subs</p>
                        <p className="text-xl font-semibold text-white">
                          {formatNumber(latestTotals?.activeSubscriptions ?? 0)}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ActiveSubscriptionsAreaChart
                        timeseries={visibleTimeseries}
                        selectedProjectIds={selectedProjectIds}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex items-center justify-between">
                      <div>
                        <CardTitle>Annual Run Rate</CardTitle>
                        <p className="text-sm text-white/60">Yearly revenue stacked by project</p>
                      </div>
                      <div className="text-right text-sm text-white/60">
                        <p>Total ARR</p>
                        <p className="text-xl font-semibold text-white">
                          {formatCurrency(latestTotals?.arr ?? 0)}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ArrAreaChart
                        timeseries={visibleTimeseries}
                        selectedProjectIds={selectedProjectIds}
                      />
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <CardTitle>Live Breakdown</CardTitle>
                      <p className="text-sm text-white/60">Latest monthly snapshot</p>
                    </div>
                    <div className="text-right text-sm text-white/60">
                      <p>Active Customers</p>
                      <p className="text-2xl font-semibold text-white">
                        {formatNumber(latestTotals?.activeCustomers ?? 0)}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-white/50">New Customers</p>
                        <p className="text-2xl font-semibold text-white">
                          {formatNumber(latestTotals?.newCustomers ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-white/50">Churned</p>
                        <p className="text-2xl font-semibold text-white">
                          {formatNumber(latestTotals?.churnedCustomers ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-white/50">Coupons Redeemed</p>
                        <p className="text-2xl font-semibold text-white">
                          {formatNumber(latestTotals?.couponsRedeemed ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-white/50">Failed Charges</p>
                        <p className="text-2xl font-semibold text-white">
                          {formatCurrency(latestTotals?.failedCharges ?? 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
              </div>
            )}

            {activePanel === 'expenses-analytics' && (
              <div className="mt-8">
                <ProfitabilityCharts
                  timeseries={visibleTimeseries}
                  selectedProjectIds={selectedProjectIds}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
