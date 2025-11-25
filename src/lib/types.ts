export interface MonthlyRate {
  date: string;
  growthRate: number;
  churnRate: number;
  salesMarketingExpense?: number;
}

export interface ProjectPricing {
  base: number;
  promoDiscount: number;
  promoMonths: number;
}

export interface ProjectMetrics {
  cogs: number;
  fees: number;
}

export interface BlueprintProject {
  id: string;
  name: string;
  description: string;
  startingSubscribers: number;
  pricing: ProjectPricing;
  metrics: ProjectMetrics;
  monthlyData: MonthlyRate[];
}

export interface SharedExpenses {
  generalAndAdministrative: number;
  technologyAndDevelopment: number;
  fulfillmentAndService: number;
  depreciationAndAmortization: number;
}

export type SharedExpenseOverrides = Record<string, Partial<SharedExpenses>>;

export interface GlobalSettings {
  startDate: string;
  endDate: string;
  transactionFeeRate: number;
  failedChargeRate: number;
  refundRate: number;
  reactivationRate: number;
  planUpgradeRate: number;
  planDowngradeRate: number;
  couponRedemptionRate: number;
  vatRate: number;
  corporateTaxRate: number;
  corporateTaxThreshold: number;
  sharedExpenses: SharedExpenses;
  sharedExpenseOverrides?: SharedExpenseOverrides;
}

export interface ProjectTimeseriesPoint {
  date: string;
  activeCustomers: number;
  newCustomers: number;
  churnedCustomers: number;
  reactivatedCustomers: number;
  grossRevenue: number;
  mrr: number;
  netRevenue: number;
  fees: number;
  cogs: number;
  arpu: number;
  arr: number;
  ltv: number;
  mrrGrowthRate: number;
  userChurnRate: number;
  revenueChurnRate: number;
  quickRatio: number;
  upgrades: number;
  downgrades: number;
  otherRevenue: number;
  couponsRedeemed: number;
  failedCharges: number;
  refunds: number;
  expansionMRR: number;
  contractionMRR: number;
  churnMRR: number;
  newMRR: number;
  activeSubscriptions: number;
  salesMarketingExpense: number;
  sharedExpenses: number;
  totalExpenses: number;
  vat: number;
  corporateIncomeTax: number;
  profit: number;
}

export interface TimeseriesPoint {
  date: string;
  totals: ProjectTimeseriesPoint;
  projects: Record<string, ProjectTimeseriesPoint>;
}

export interface DashboardSummary {
  totalMRR: number;
  grossRevenue: number;
  netRevenue: number;
  totalExpenses: number;
  vat: number;
  corporateIncomeTax: number;
  profit: number;
  totalCustomers: number;
  arr: number;
  ltv: number;
  quickRatio: number;
  mrrGrowthRate: number;
  userChurnRate: number;
  revenueChurnRate: number;
}

export interface CohortRow {
  cohortStart: string;
  retention: number[];
}

export interface CohortMatrix {
  projectId: string;
  rows: CohortRow[];
}

export interface SimulationResponse {
  summary: DashboardSummary;
  timeseries: TimeseriesPoint[];
  cohorts: CohortMatrix[];
  metadata: {
    months: string[];
    projects: Array<{ id: string; name: string; description: string }>;
    globalDefaults: GlobalSettings;
  };
}

export interface ForecastBlueprint {
  projects: BlueprintProject[];
  globalSettings: GlobalSettings;
}

export interface DefaultsResponse {
  blueprint: ForecastBlueprint;
  simulation: SimulationResponse;
}

export interface MonthlyOverridePayload {
  date: string;
  growth?: number;
  churn?: number;
  salesMarketingExpense?: number;
}

export interface SimulationProjectPayload {
  id: string;
  startingSubscribers?: number;
  pricing?: Partial<ProjectPricing>;
  metrics?: Partial<ProjectMetrics>;
  monthlyOverrides: MonthlyOverridePayload[];
}

export interface SimulationRequestPayload {
  projects?: SimulationProjectPayload[];
  globalSettings?: Partial<Omit<GlobalSettings, 'sharedExpenses'>> & {
    sharedExpenses?: Partial<SharedExpenses>;
    sharedExpenseOverrides?: SharedExpenseOverrides;
  };
  selectedProjectIds?: string[];
}

export interface RateOverride {
  growth?: number;
  churn?: number;
  salesMarketingExpense?: number;
}

export type OverrideState = Record<string, Record<string, RateOverride>>;

export interface ProjectSettingAdjustment {
  startingSubscribers?: number | undefined;
  pricing?: Partial<ProjectPricing> | undefined;
  metrics?: Partial<ProjectMetrics> | undefined;
}

export type ProjectSettingsState = Record<string, ProjectSettingAdjustment>;

type ScenarioGlobalSettings = Partial<Omit<GlobalSettings, 'sharedExpenses'>> & {
  sharedExpenses?: Partial<SharedExpenses>;
  sharedExpenseOverrides?: SharedExpenseOverrides;
};

export interface ScenarioPayload {
  name: string;
  notes?: string | undefined;
  overrides: OverrideState;
  projectSettings: ProjectSettingsState;
  selectedProjectIds: string[];
  globalSettings?: ScenarioGlobalSettings | undefined;
}

export interface ScenarioRecord extends ScenarioPayload {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRecord {
  id: string;
  name: string;
  description?: string;
}
