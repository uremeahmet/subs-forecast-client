'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createProjectRecord,
  createScenario,
  deleteProjectRecord,
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
  SharedExpenseOverrides,
  SimulationProjectPayload,
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

const cloneSharedExpenseOverrides = (overrides?: SharedExpenseOverrides | null) => {
  if (!overrides) return {};
  return Object.fromEntries(
    Object.entries(overrides).map(([month, value]) => [month, { ...(value ?? {}) }])
  );
};

const buildSharedExpenseOverridesDiff = (
  current?: SharedExpenseOverrides | null,
  baseline?: SharedExpenseOverrides | null
) => {
  if (!current) return undefined;
  const monthKeys = new Set([
    ...Object.keys(current),
    ...Object.keys(baseline ?? {}),
  ]);
  const diff: SharedExpenseOverrides = {};
  monthKeys.forEach((month) => {
    const currentValues = current[month];
    const baselineValues = baseline?.[month];
    if (!currentValues && !baselineValues) {
      return;
    }
    const monthDiff: Partial<SharedExpenses> = {};
    SHARED_EXPENSE_KEYS.forEach((key) => {
      const currentValue = currentValues?.[key];
      const baselineValue = baselineValues?.[key];
      if (currentValue === undefined && baselineValue === undefined) {
        return;
      }
      if (
        baselineValue === undefined ||
        currentValue === undefined ||
        Math.abs(currentValue - baselineValue) > 0.0001
      ) {
        if (currentValue !== undefined) {
          monthDiff[key] = currentValue;
        }
      }
    });
    if (Object.keys(monthDiff).length) {
      diff[month] = monthDiff;
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
  const [sharedExpenseBase, setSharedExpenseBase] = useState<SharedExpenses | null>(null);
  const [sharedExpenseOverrides, setSharedExpenseOverrides] = useState<SharedExpenseOverrides>({});
  const [scenarios, setScenarios] = useState<ScenarioRecord[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [scenarioDraft, setScenarioDraft] = useState<{ name: string; notes: string }>({
    name: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSavingScenario, setIsSavingScenario] = useState(false);
  const [isProjectMutating, setIsProjectMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDefaults = useCallback(
    async (options?: { focusProjectId?: string }) => {
      try {
        setIsLoading(true);
        const { blueprint: incomingBlueprint, simulation: initialSimulation } = await fetchDefaults();
        setBlueprint(incomingBlueprint);
        setSimulation(initialSimulation);
        const projectIds = incomingBlueprint.projects.map((project) => project.id);
        const focusId =
          options?.focusProjectId && projectIds.includes(options.focusProjectId)
            ? options.focusProjectId
            : incomingBlueprint.projects[0]?.id ?? null;
        setSelectedProjectId(focusId);
        setSelectedProjectIds(projectIds);
        setSharedExpenseBase(mergeSharedExpenses(incomingBlueprint.globalSettings.sharedExpenses));
        setSharedExpenseOverrides(
          cloneSharedExpenseOverrides(incomingBlueprint.globalSettings.sharedExpenseOverrides)
        );
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadDefaults();
  }, [loadDefaults]);

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
    (options?: {
      base?: SharedExpenses | null;
      overrides?: SharedExpenseOverrides;
    }) => {
      if (!blueprint) return undefined;
      const baselineBase = mergeSharedExpenses(blueprint.globalSettings.sharedExpenses);
      const baseDiff = buildSharedExpenseDiff(options?.base ?? sharedExpenseBase, baselineBase);
      const overrideDiff = buildSharedExpenseOverridesDiff(
        options?.overrides ?? sharedExpenseOverrides,
        blueprint.globalSettings.sharedExpenseOverrides
      );
      if (!baseDiff && !overrideDiff) return undefined;
      return {
        ...(baseDiff ? { sharedExpenses: baseDiff } : {}),
        ...(overrideDiff ? { sharedExpenseOverrides: overrideDiff } : {}),
      };
    },
    [blueprint, sharedExpenseBase, sharedExpenseOverrides]
  );

  const addProject = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      try {
        setIsProjectMutating(true);
        const project = await createProjectRecord(trimmed);
        await loadDefaults({ focusProjectId: project.id });
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsProjectMutating(false);
      }
    },
    [loadDefaults]
  );

  const removeProject = useCallback(
    async (projectId: string) => {
      try {
        setIsProjectMutating(true);
        await deleteProjectRecord(projectId);
        await loadDefaults();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsProjectMutating(false);
      }
    },
    [loadDefaults]
  );

  const triggerSimulation = useCallback(
    async (options?: {
      overrides?: OverrideState;
      projectSettings?: ProjectSettingsState;
      selected?: string[];
      sharedExpenseBase?: SharedExpenses | null;
      sharedExpenseOverrides?: SharedExpenseOverrides;
    }) => {
      if (!blueprint) {
        return;
      }
      const nextOverrides = options?.overrides ?? overrides;
      const nextSettings = options?.projectSettings ?? projectSettings;
      const nextSelected = options?.selected ?? selectedProjectIds;
      const nextSharedBase = options?.sharedExpenseBase ?? sharedExpenseBase;
      const nextSharedOverrides = options?.sharedExpenseOverrides ?? sharedExpenseOverrides;

      setIsSimulating(true);
      try {
        const payload: SimulationRequestPayload = {
          selectedProjectIds: nextSelected,
        };

        const projectPayload: SimulationProjectPayload[] = [];

        blueprint.projects.forEach((project) => {
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
            return;
          }

          projectPayload.push({
            id: project.id,
            startingSubscribers: settings?.startingSubscribers,
            pricing: settings?.pricing,
            metrics: settings?.metrics,
            monthlyOverrides,
          });
        });

        if (projectPayload.length) {
          payload.projects = projectPayload;
        }

        const sharedDiff = resolveSharedExpenseDiff({
          base: nextSharedBase,
          overrides: nextSharedOverrides,
        });
        if (sharedDiff) {
          payload.globalSettings = sharedDiff;
        }

        const response = await runSimulation(payload);
        setSimulation(response);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsSimulating(false);
      }
    },
    [
      blueprint,
      overrides,
      projectSettings,
      selectedProjectIds,
      sharedExpenseBase,
      sharedExpenseOverrides,
      resolveSharedExpenseDiff,
    ]
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
          const defaults = project[containerKey] as unknown as Record<string, number>;
          const container = {
            ...((existing[containerKey] as Record<string, number> | undefined) ?? {}),
          };
          container[key] = nextValue;

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

  const updateSharedExpenseBase = useCallback(
    (key: keyof SharedExpenses, value: number) => {
      const baseline =
        sharedExpenseBase ??
        (blueprint ? mergeSharedExpenses(blueprint.globalSettings.sharedExpenses) : null);
      if (!baseline) return;
      const normalized = Number.isFinite(value) ? Number(value) : 0;
      const next = { ...baseline, [key]: normalized };
      setSharedExpenseBase(next);
      void triggerSimulation({ sharedExpenseBase: next });
    },
    [blueprint, sharedExpenseBase, triggerSimulation]
  );

  const updateSharedExpenseOverride = useCallback(
    (month: string, key: keyof SharedExpenses, value: number) => {
      const baseline =
        sharedExpenseBase ??
        (blueprint ? mergeSharedExpenses(blueprint.globalSettings.sharedExpenses) : null);
      if (!baseline) return;
      const normalized = Number.isFinite(value) ? Number(value) : 0;
      setSharedExpenseOverrides((prev) => {
        const next: SharedExpenseOverrides = { ...prev };
        const monthOverrides = { ...(next[month] ?? {}) };
        if (Math.abs(baseline[key] - normalized) < 0.0001) {
          delete monthOverrides[key];
        } else {
          monthOverrides[key] = normalized;
        }
        if (Object.keys(monthOverrides).length === 0) {
          delete next[month];
        } else {
          next[month] = monthOverrides;
        }
        void triggerSimulation({ sharedExpenseOverrides: next });
        return next;
      });
    },
    [blueprint, sharedExpenseBase, triggerSimulation]
  );

  const clearSharedExpenseOverridesForMonth = useCallback((month: string) => {
    setSharedExpenseOverrides((prev) => {
      if (!prev[month]) return prev;
      const next: SharedExpenseOverrides = { ...prev };
      delete next[month];
      void triggerSimulation({ sharedExpenseOverrides: next });
      return next;
    });
  }, [triggerSimulation]);

  const resetSharedExpenseInputs = useCallback(() => {
    if (!blueprint) return;
    const defaults = mergeSharedExpenses(blueprint.globalSettings.sharedExpenses);
    const overrideDefaults = cloneSharedExpenseOverrides(
      blueprint.globalSettings.sharedExpenseOverrides
    );
    setSharedExpenseBase(defaults);
    setSharedExpenseOverrides(overrideDefaults);
    void triggerSimulation({
      sharedExpenseBase: defaults,
      sharedExpenseOverrides: overrideDefaults,
    });
  }, [blueprint, triggerSimulation]);

  const applyScenario = useCallback(
    (scenario: ScenarioRecord) => {
      if (!blueprint) return;
      const nextOverrides = scenario.overrides ?? {};
      const nextSettings = scenario.projectSettings ?? {};
      const fallbackProjects = blueprint.projects.map((project) => project.id);
      const nextSelected = scenario.selectedProjectIds?.length ? scenario.selectedProjectIds : fallbackProjects;
      const nextSharedBase = mergeSharedExpenses(
        blueprint.globalSettings.sharedExpenses,
        scenario.globalSettings?.sharedExpenses ?? null
      );
      const nextSharedOverrides = cloneSharedExpenseOverrides(
        scenario.globalSettings?.sharedExpenseOverrides ?? {}
      );

      setOverrides(nextOverrides);
      setProjectSettings(nextSettings);
      setSelectedProjectIds(nextSelected);
      setSelectedProjectId((prev) => (prev && nextSelected.includes(prev) ? prev : nextSelected[0] ?? null));
      setActiveScenarioId(scenario.id);
      setScenarioDraft({ name: scenario.name, notes: scenario.notes ?? '' });
      setSharedExpenseBase(nextSharedBase);
      setSharedExpenseOverrides(nextSharedOverrides);

      void triggerSimulation({
        overrides: nextOverrides,
        projectSettings: nextSettings,
        selected: nextSelected,
        sharedExpenseBase: nextSharedBase,
        sharedExpenseOverrides: nextSharedOverrides,
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
          const defaultOverrides = cloneSharedExpenseOverrides(
            blueprint.globalSettings.sharedExpenseOverrides
          );
          setSharedExpenseBase(defaults);
          setSharedExpenseOverrides(defaultOverrides);
          void triggerSimulation({
            sharedExpenseBase: defaults,
            sharedExpenseOverrides: defaultOverrides,
          });
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
      const sharedDiff = resolveSharedExpenseDiff();
      const payload = {
        name: trimmedName,
        notes: notes.length ? notes : undefined,
        overrides,
        projectSettings,
        selectedProjectIds,
        globalSettings: sharedDiff,
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
    isProjectMutating,
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
    scenarios,
    activeScenarioId,
    selectScenario,
    scenarioDraft,
    updateScenarioDraft,
    persistScenario,
    addProject,
    removeProject,
    refresh: () => triggerSimulation(),
  };
};
