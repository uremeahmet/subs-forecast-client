'use client';

import { useState } from 'react';
import { ProjectSidebar } from '@/components/sidebar/ProjectSidebar';
import { useForecastSimulation } from '@/hooks/useForecastSimulation';
import { KpiGrid } from '@/components/control-center/KpiGrid';
import { MrrAreaChart } from '@/components/charts/MrrAreaChart';
import { GrowthBreakdownChart } from '@/components/charts/GrowthBreakdownChart';
import { RetentionHeatmap } from '@/components/charts/RetentionHeatmap';
import { ScenarioToolbar } from '@/components/control-center/ScenarioToolbar';
import { ExpensesPanel } from '@/components/expenses/ExpensesPanel';
import { ProfitabilityCharts } from '@/components/charts/ProfitabilityCharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { formatCurrency, formatNumber } from '@/lib/format';

export default function HomePage() {
  const [activePanel, setActivePanel] = useState<'overview' | 'expenses-input' | 'expenses-analytics'>(
    'overview'
  );
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
    sharedExpenses,
    updateSharedExpense,
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
  } = useForecastSimulation();

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

  const latestTotals = simulation.timeseries.at(-1)?.totals ?? null;
  const previousTotals = simulation.timeseries.at(-2)?.totals ?? null;
  const cohort = simulation.cohorts.find((entry) => entry.projectId === selectedProjectId);
  const selectedOverrides = selectedProjectId ? overrides[selectedProjectId] ?? {} : {};
  const selectedAdjustments = selectedProjectId ? projectSettings[selectedProjectId] : undefined;

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <ProjectSidebar
        projects={blueprint.projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={(id) => setSelectedProjectId(id)}
        selectedProject={selectedProject}
        projectAdjustments={selectedAdjustments}
        overrides={selectedOverrides}
        onOverrideChange={(projectId, date, field, value) => updateMonthlyOverride(projectId, date, field, value)}
        onResetOverrides={() => selectedProjectId && resetOverrides(selectedProjectId)}
        onResetProjectSettings={() => selectedProjectId && resetProjectSettings(selectedProjectId)}
        onSettingChange={(projectId, section, key, value) => updateProjectSetting(projectId, section, key, value)}
      />

      <main className="flex-1 overflow-y-auto p-8">
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
            { key: 'expenses-input', label: 'Expenses Input' },
            { key: 'expenses-analytics', label: 'Expenses Analytics' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() =>
                setActivePanel(
                  tab.key as 'overview' | 'expenses-input' | 'expenses-analytics'
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

        {activePanel === 'expenses-input' && (
          <ExpensesPanel
            projects={blueprint.projects}
            overrides={overrides}
            sharedExpenses={sharedExpenses}
            onSharedExpenseChange={updateSharedExpense}
            onResetSharedExpenses={resetSharedExpenseInputs}
            onSalesMarketingChange={(projectId, date, value) =>
              updateMonthlyOverride(projectId, date, 'salesMarketingExpense', value)
            }
          />
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

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

        {activePanel !== 'expenses-input' && (
          <>
            {activePanel === 'overview' && (
              <div className="space-y-8">
                <KpiGrid
                  summary={simulation.summary}
                  latest={latestTotals}
                  previous={previousTotals}
                  timeseries={simulation.timeseries}
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
                        timeseries={simulation.timeseries}
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
                      <GrowthBreakdownChart timeseries={simulation.timeseries} />
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Retention Heatmap</CardTitle>
                    <p className="text-sm text-white/60">
                      Cohort view for {selectedProject?.name ?? 'selected project'}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <RetentionHeatmap cohort={cohort} />
                  </CardContent>
                </Card>

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
                <ProfitabilityCharts timeseries={simulation.timeseries} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
