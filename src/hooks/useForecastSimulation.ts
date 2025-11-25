'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createScenario,
  fetchDefaults,
  fetchScenarios,
  runSimulation,
  updateScenarioRecord,
} from '../lib/api';
import type {
  ForecastBlueprint,
  OverrideState,
  ProjectSettingsState,
  RateOverride,
  ScenarioRecord,
  SharedExpenses,
  SimulationRequestPayload,
  SimulationResponse,
} from '../lib/types';

const SHARED_EXPENSE_KEYS: Array<keyof SharedExpenses> = [
  'generalAndAdministrative',
  'technologyAndDevelopment',
  'fulfillmentAndService',
  'depreciationAndAmortization',
];

const mergeSharedExpenses = (
  base?: SharedExpenses | null,
  override?: Partial<SharedExpenses> | null
): SharedExpenses => {
  const result: SharedExpenses = {
    generalAndAdministrative: base?.generalAndAdministrative ?? 0,
    technologyAndDevelopment: base?.technologyAndDevelopment ?? 0,
    fulfillmentAndService: base?.fulfillmentAndService ?? 0,
    depreciationAndAmortization: base?.depreciationAndAmortization ?? 0,
  };

  if (override) {
    SHARED_EXPENSE_KEYS.forEach((key) => {
      if (override[key] !== undefined) {
        result[key] = override[key] as number;
      }
    });
  }

  return result;
};

const buildSharedExpenseDiff = (
  current: SharedExpenses | null,
  baseline?: SharedExpenses | null
) => {
  if (!current || !baseline) return undefined;
  const diff: Partial<SharedExpenses> = {};
  SHARED_EXPENSE_KEYS.forEach((key) => {
    const baselineValue = baseline[key] ?? 0;
    const currentValue = current[key] ?? 0;
    if (Math.abs(currentValue - baselineValue) > 0.0001) {
      diff[key] = currentValue;
    }
  });
  return Object.keys(diff).length ? diff : undefined;
};

export const useForecastSimulation = () => {
  const [blueprint, setBlueprint] = useState<ForecastBlueprint | null>(null);
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null);
  const [overrides, setOverrides] = useState<OverrideState>({});
  const [projectSettings, setProjectSettings] = useState<ProjectSettingsState>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [sharedExpenses, setSharedExpenses] = useState<SharedExpenses | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioRecord[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [scenarioDraft, setScenarioDraft] = useState<{ name: string; notes: string }>({
    name: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSavingScenario, setIsSavingScenario] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDefaults = async () => {
      try {
        setIsLoading(true);
        const { blueprint: incomingBlueprint, simulation: initialSimulation } = await fetchDefaults();
        setBlueprint(incomingBlueprint);
        setSimulation(initialSimulation);
        setSelectedProjectId(incomingBlueprint.projects[0]?.id ?? null);
        setSelectedProjectIds(incomingBlueprint.projects.map((project) => project.id));
        setSharedExpenses(mergeSharedExpenses(incomingBlueprint.globalSettings.sharedExpenses));
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDefaults();
  }, []);

  const refreshScenarios = useCallback(async () => {
    try {
      const records = await fetchScenarios();
      setScenarios(records);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    void refreshScenarios();
  }, [refreshScenarios]);

  const resolveSharedExpenseDiff = useCallback(
    (nextShared?: SharedExpenses | null) => {
      if (!blueprint) return undefined;
      return buildSharedExpenseDiff(
        nextShared ?? sharedExpenses,
        blueprint.globalSettings.sharedExpenses
      );
    },
    [blueprint, sharedExpenses]
  );

  const triggerSimulation = useCallback(
    async (options?: {
      overrides?: OverrideState;
      projectSettings?: ProjectSettingsState;
      selected?: string[];
      sharedExpenses?: SharedExpenses | null;
    }) => {
      if (!blueprint) {
        return;
      }
      const nextOverrides = options?.overrides ?? overrides;
      const nextSettings = options?.projectSettings ?? projectSettings;
      const nextSelected = options?.selected ?? selectedProjectIds;
      const nextShared = options?.sharedExpenses ?? sharedExpenses;

      setIsSimulating(true);
      try {
        const payload: SimulationRequestPayload = {
          selectedProjectIds: nextSelected,
        };

        const projectPayload = blueprint.projects
          .map((project) => {
            const overrideEntries = Object.entries(nextOverrides[project.id] ?? {});
            const settings = nextSettings[project.id];
            const monthlyOverrides = overrideEntries.map(([date, value]) => ({
              date,
              growth: value.growth,
              churn: value.churn,
              salesMarketingExpense: value.salesMarketingExpense,
            }));

            const hasSettings = Boolean(
              settings?.startingSubscribers !== undefined ||
                (settings?.pricing && Object.keys(settings.pricing).length) ||
                (settings?.metrics && Object.keys(settings.metrics).length)
            );

            if (!monthlyOverrides.length && !hasSettings) {
              return null;
            }

            return {
              id: project.id,
              startingSubscribers: settings?.startingSubscribers,
              pricing: settings?.pricing,
              metrics: settings?.metrics,
              monthlyOverrides,
            };
          })
          .filter(Boolean);

        if (projectPayload.length) {
          payload.projects = projectPayload;
        }

        const sharedDiff = resolveSharedExpenseDiff(nextShared);
        if (sharedDiff) {
          payload.globalSettings = { sharedExpenses: sharedDiff };
        }

        const response = await runSimulation(payload);
        setSimulation(response);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsSimulating(false);
      }
    },
    [blueprint, overrides, projectSettings, selectedProjectIds, sharedExpenses, resolveSharedExpenseDiff]
  );

  const upsertOverrides = useCallback(
    (projectId: string, date: string, nextValue: RateOverride | null) => {
      setOverrides((prev) => {
        const next: OverrideState = { ...prev };
        const projectOverrides = { ...(next[projectId] ?? {}) };

        const hasValues =
          nextValue &&
          (nextValue.growth !== undefined ||
            nextValue.churn !== undefined ||
            nextValue.salesMarketingExpense !== undefined);

        if (!hasValues) {
          delete projectOverrides[date];
        } else {
          projectOverrides[date] = nextValue as RateOverride;
        }

        if (Object.keys(projectOverrides).length === 0) {
          delete next[projectId];
        } else {
          next[projectId] = projectOverrides;
        }

        void triggerSimulation({ overrides: next });
        return next;
      });
    },
    [triggerSimulation]
  );

  const updateMonthlyOverride = useCallback(
    (projectId: string, date: string, field: keyof RateOverride, value: number) => {
      if (!blueprint) return;
      const project = blueprint.projects.find((candidate) => candidate.id === projectId);
      if (!project) return;

      const defaultRate = project.monthlyData.find((entry) => entry.date === date);
      const normalized = Number.isFinite(value) ? Number(value) : 0;
      const existing = overrides[projectId]?.[date] ?? {};
      const nextValue: RateOverride = { ...existing, [field]: normalized };

      let defaultValue: number | undefined;
      if (field === 'growth') {
        defaultValue = defaultRate?.growthRate;
      } else if (field === 'churn') {
        defaultValue = defaultRate?.churnRate;
      } else {
        defaultValue = defaultRate?.salesMarketingExpense ?? 0;
      }
      if (defaultValue !== undefined && Math.abs(defaultValue - normalized) < 0.0001) {
        delete nextValue[field];
      }

      const hasValues =
        nextValue.growth !== undefined ||
        nextValue.churn !== undefined ||
        nextValue.salesMarketingExpense !== undefined;

      if (!hasValues) {
        upsertOverrides(projectId, date, null);
      } else {
        upsertOverrides(projectId, date, nextValue);
      }
    },
    [blueprint, overrides, upsertOverrides]
  );

  const updateProjectSetting = useCallback(
    (
      projectId: string,
      section: 'startingSubscribers' | 'pricing' | 'metrics',
      key: string,
      value: number
    ) => {
      if (!blueprint) return;
      const project = blueprint.projects.find((candidate) => candidate.id === projectId);
      if (!project) return;

      const nextValue = Number.isFinite(value) ? Number(value) : 0;

      setProjectSettings((prev) => {
        const next: ProjectSettingsState = { ...prev };
        const existing = { ...(next[projectId] ?? {}) };

        if (section === 'startingSubscribers') {
          existing.startingSubscribers = nextValue;
        } else {
          const containerKey = section === 'pricing' ? 'pricing' : 'metrics';
          const defaults = project[containerKey];
          const container = { ...(existing[containerKey] ?? {}) };
          container[key as keyof typeof container] = nextValue;

          const defaultValue = defaults[key as keyof typeof defaults];
          if (defaultValue !== undefined && Math.abs(defaultValue - nextValue) < 0.0001) {
            delete container[key as keyof typeof container];
          }

          if (Object.keys(container).length === 0) {
            delete existing[containerKey];
          } else {
            existing[containerKey] = container;
          }
        }

        const defaultSubscribers = project.startingSubscribers;
        if (
          existing.startingSubscribers !== undefined &&
          Math.abs(existing.startingSubscribers - defaultSubscribers) < 0.5
        ) {
          delete existing.startingSubscribers;
        }

        if (
          !existing.startingSubscribers &&
          !existing.pricing &&
          !existing.metrics
        ) {
          delete next[projectId];
        } else {
          next[projectId] = existing;
        }

        void triggerSimulation({ projectSettings: next });
        return next;
      });
    },
    [blueprint, triggerSimulation]
  );

  const toggleProjectSelection = useCallback(
    (projectId: string) => {
      setSelectedProjectIds((prev) => {
        const exists = prev.includes(projectId);
        const next = exists ? prev.filter((id) => id !== projectId) : [...prev, projectId];
        const finalList = next.length ? next : [projectId];
        void triggerSimulation({ selected: finalList });
        return finalList;
      });
    },
    [triggerSimulation]
  );

  const setProjectFilters = useCallback(
    (ids: string[]) => {
      if (!ids.length) return;
      setSelectedProjectIds(ids);
      void triggerSimulation({ selected: ids });
    },
    [triggerSimulation]
  );

  const resetOverrides = useCallback(
    (projectId: string) => {
      setOverrides((prev) => {
        if (!prev[projectId]) return prev;
        const next: OverrideState = { ...prev };
        delete next[projectId];
        void triggerSimulation({ overrides: next });
        return next;
      });
    },
    [triggerSimulation]
  );

  const resetProjectSettings = useCallback(
    (projectId: string) => {
      setProjectSettings((prev) => {
        if (!prev[projectId]) return prev;
        const next: ProjectSettingsState = { ...prev };
        delete next[projectId];
        void triggerSimulation({ projectSettings: next });
        return next;
      });
    },
    [triggerSimulation]
  );

  const updateSharedExpense = useCallback(
    (key: keyof SharedExpenses, value: number) => {
      setSharedExpenses((prev) => {
        const baseline = prev ?? (blueprint ? mergeSharedExpenses(blueprint.globalSettings.sharedExpenses) : null);
        if (!baseline) return prev;
        const next = { ...baseline, [key]: Number.isFinite(value) ? Number(value) : 0 };
        void triggerSimulation({ sharedExpenses: next });
        return next;
      });
    },
    [blueprint, triggerSimulation]
  );

  const resetSharedExpenseInputs = useCallback(() => {
    if (!blueprint) return;
    const defaults = mergeSharedExpenses(blueprint.globalSettings.sharedExpenses);
    setSharedExpenses(defaults);
    void triggerSimulation({ sharedExpenses: defaults });
  }, [blueprint, triggerSimulation]);

  const applyScenario = useCallback(
    (scenario: ScenarioRecord) => {
      if (!blueprint) return;
      const nextOverrides = scenario.overrides ?? {};
      const nextSettings = scenario.projectSettings ?? {};
      const fallbackProjects = blueprint.projects.map((project) => project.id);
      const nextSelected = scenario.selectedProjectIds?.length ? scenario.selectedProjectIds : fallbackProjects;
      const nextShared = mergeSharedExpenses(
        blueprint.globalSettings.sharedExpenses,
        scenario.globalSettings?.sharedExpenses ?? null
      );

      setOverrides(nextOverrides);
      setProjectSettings(nextSettings);
      setSelectedProjectIds(nextSelected);
      setSelectedProjectId((prev) => (prev && nextSelected.includes(prev) ? prev : nextSelected[0] ?? null));
      setActiveScenarioId(scenario.id);
      setScenarioDraft({ name: scenario.name, notes: scenario.notes ?? '' });
      setSharedExpenses(nextShared);

      void triggerSimulation({
        overrides: nextOverrides,
        projectSettings: nextSettings,
        selected: nextSelected,
        sharedExpenses: nextShared,
      });
    },
    [blueprint, triggerSimulation]
  );

  const selectScenario = useCallback(
    (scenarioId: string | null) => {
      if (!scenarioId) {
        setActiveScenarioId(null);
        if (blueprint) {
          const defaults = mergeSharedExpenses(blueprint.globalSettings.sharedExpenses);
          setSharedExpenses(defaults);
          void triggerSimulation({ sharedExpenses: defaults });
        }
        return;
      }
      const scenario = scenarios.find((record) => record.id === scenarioId);
      if (!scenario) return;
      applyScenario(scenario);
    },
    [applyScenario, blueprint, scenarios, triggerSimulation]
  );

  const updateScenarioDraft = useCallback((field: 'name' | 'notes', value: string) => {
    setScenarioDraft((prev) => ({ ...prev, [field]: value }));
  }, []);

  const persistScenario = useCallback(
    async (options?: { id?: string }) => {
      if (!blueprint) return;
      const trimmedName = scenarioDraft.name.trim();
      if (!trimmedName) {
        setError('Scenario name is required.');
        return;
      }

      const notes = scenarioDraft.notes.trim();
      const sharedDiff = resolveSharedExpenseDiff(sharedExpenses);
      const payload = {
        name: trimmedName,
        notes: notes.length ? notes : undefined,
        overrides,
        projectSettings,
        selectedProjectIds,
        globalSettings: sharedDiff ? { sharedExpenses: sharedDiff } : undefined,
      };

      setIsSavingScenario(true);
      try {
        const record = options?.id
          ? await updateScenarioRecord(options.id, payload)
          : await createScenario(payload);
        setActiveScenarioId(record.id);
        setScenarioDraft({ name: record.name, notes: record.notes ?? '' });
        await refreshScenarios();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsSavingScenario(false);
      }
    },
    [
      blueprint,
      overrides,
      projectSettings,
      refreshScenarios,
      scenarioDraft,
      selectedProjectIds,
      resolveSharedExpenseDiff,
      sharedExpenses,
    ]
  );

  const selectedProject = useMemo(() => {
    if (!blueprint || !selectedProjectId) return null;
    return blueprint.projects.find((project) => project.id === selectedProjectId) ?? null;
  }, [blueprint, selectedProjectId]);

  return {
    blueprint,
    simulation,
    isLoading,
    isSimulating,
    isSavingScenario,
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
    scenarios,
    activeScenarioId,
    selectScenario,
    scenarioDraft,
    updateScenarioDraft,
    persistScenario,
    refresh: () => triggerSimulation(),
  };
};
