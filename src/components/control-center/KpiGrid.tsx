'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { computeDelta, formatCurrency, formatNumber, formatPercent } from '@/lib/format';
import type { DashboardSummary, ProjectTimeseriesPoint, TimeseriesPoint } from '@/lib/types';
import { Sparkline } from './Sparkline';

interface KpiGridProps {
  summary?: DashboardSummary | null;
  latest?: ProjectTimeseriesPoint | null;
  previous?: ProjectTimeseriesPoint | null;
  timeseries: TimeseriesPoint[];
}

type KpiFormat = 'currency' | 'number' | 'percent' | 'ratio';
type SparkDatum = { label: string; value: number };

const renderValue = (value: number, format: KpiFormat) => {
  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percent':
      return formatPercent(value);
    case 'ratio':
      return value.toFixed(2);
    default:
      return formatNumber(value);
  }
};

export const KpiGrid = ({ summary, latest, previous, timeseries }: KpiGridProps) => {
  const latestTotals = latest ?? timeseries[timeseries.length - 1]?.totals;
  const previousTotals = previous ?? timeseries[timeseries.length - 2]?.totals;

  const sparkSource = timeseries.map((entry) => ({
    date: entry.date,
    totals: entry.totals,
  }));

  const formatMonthLabel = (iso: string) =>
    new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(`${iso}-01`));

  const buildSpark = (selector: (point: ProjectTimeseriesPoint) => number): SparkDatum[] =>
    sparkSource.map((item) => ({
      label: formatMonthLabel(item.date),
      value: selector(item.totals),
    }));

  const cards = [
    {
      key: 'mrr',
      label: 'Monthly Recurring Revenue',
      value: summary?.totalMRR ?? latestTotals?.mrr ?? 0,
      format: 'currency' as KpiFormat,
      delta: computeDelta(latestTotals?.mrr ?? 0, previousTotals?.mrr ?? 0),
      spark: buildSpark((item) => item.mrr),
    },
    {
      key: 'net',
      label: 'Net Revenue',
      value: summary?.netRevenue ?? latestTotals?.netRevenue ?? 0,
      format: 'currency' as KpiFormat,
      delta: computeDelta(latestTotals?.netRevenue ?? 0, previousTotals?.netRevenue ?? 0),
      spark: buildSpark((item) => item.netRevenue),
    },
    {
      key: 'fees',
      label: 'Fees',
      value: latestTotals?.fees ?? 0,
      format: 'currency' as KpiFormat,
      delta: computeDelta(latestTotals?.fees ?? 0, previousTotals?.fees ?? 0),
      spark: buildSpark((item) => item.fees),
    },
    {
      key: 'arpu',
      label: 'ARPU',
      value: latestTotals?.arpu ?? 0,
      format: 'currency' as KpiFormat,
      delta: computeDelta(latestTotals?.arpu ?? 0, previousTotals?.arpu ?? 0),
      spark: buildSpark((item) => item.arpu),
    },
    {
      key: 'arr',
      label: 'Annual Run Rate',
      value: summary?.arr ?? latestTotals?.arr ?? 0,
      format: 'currency' as KpiFormat,
      delta: computeDelta(latestTotals?.arr ?? 0, previousTotals?.arr ?? 0),
      spark: buildSpark((item) => item.arr),
    },
    {
      key: 'other-revenue',
      label: 'Other Revenue',
      value: latestTotals?.otherRevenue ?? 0,
      format: 'currency' as KpiFormat,
      delta: computeDelta(
        latestTotals?.otherRevenue ?? 0,
        previousTotals?.otherRevenue ?? 0
      ),
      spark: buildSpark((item) => item.otherRevenue),
    },
    {
      key: 'ltv',
      label: 'Lifetime Value',
      value: summary?.ltv ?? latestTotals?.ltv ?? 0,
      format: 'currency' as KpiFormat,
      delta: computeDelta(latestTotals?.ltv ?? 0, previousTotals?.ltv ?? 0),
      spark: buildSpark((item) => item.ltv),
    },
    {
      key: 'growth',
      label: 'MRR Growth Rate',
      value: summary?.mrrGrowthRate ?? latestTotals?.mrrGrowthRate ?? 0,
      format: 'percent' as KpiFormat,
      delta: computeDelta(
        summary?.mrrGrowthRate ?? latestTotals?.mrrGrowthRate ?? 0,
        previousTotals?.mrrGrowthRate ?? 0
      ),
      spark: buildSpark((item) => item.mrrGrowthRate),
    },
    {
      key: 'user-churn',
      label: 'User Churn',
      value: summary?.userChurnRate ?? latestTotals?.userChurnRate ?? 0,
      format: 'percent' as KpiFormat,
      delta: computeDelta(
        summary?.userChurnRate ?? latestTotals?.userChurnRate ?? 0,
        previousTotals?.userChurnRate ?? 0
      ),
      spark: buildSpark((item) => item.userChurnRate),
    },
    {
      key: 'revenue-churn',
      label: 'Revenue Churn',
      value: summary?.revenueChurnRate ?? latestTotals?.revenueChurnRate ?? 0,
      format: 'percent' as KpiFormat,
      delta: computeDelta(
        summary?.revenueChurnRate ?? latestTotals?.revenueChurnRate ?? 0,
        previousTotals?.revenueChurnRate ?? 0
      ),
      spark: buildSpark((item) => item.revenueChurnRate),
    },
    {
      key: 'quick',
      label: 'Quick Ratio',
      value: summary?.quickRatio ?? latestTotals?.quickRatio ?? 0,
      format: 'ratio' as KpiFormat,
      delta: computeDelta(
        summary?.quickRatio ?? latestTotals?.quickRatio ?? 0,
        previousTotals?.quickRatio ?? 0
      ),
      spark: buildSpark((item) => item.quickRatio),
    },
    {
      key: 'customers',
      label: 'Active Customers',
      value: summary?.totalCustomers ?? latestTotals?.activeCustomers ?? 0,
      format: 'number' as KpiFormat,
      delta: computeDelta(
        latestTotals?.activeCustomers ?? 0,
        previousTotals?.activeCustomers ?? 0
      ),
      spark: buildSpark((item) => item.activeCustomers),
    },
    {
      key: 'new-customers',
      label: 'New Customers',
      value: latestTotals?.newCustomers ?? 0,
      format: 'number' as KpiFormat,
      delta: computeDelta(
        latestTotals?.newCustomers ?? 0,
        previousTotals?.newCustomers ?? 0
      ),
      spark: buildSpark((item) => item.newCustomers),
    },
    {
      key: 'reactivations',
      label: 'Reactivations',
      value: latestTotals?.reactivatedCustomers ?? 0,
      format: 'number' as KpiFormat,
      delta: computeDelta(
        latestTotals?.reactivatedCustomers ?? 0,
        previousTotals?.reactivatedCustomers ?? 0
      ),
      spark: buildSpark((item) => item.reactivatedCustomers),
    },
    {
      key: 'upgrades',
      label: 'Upgrades',
      value: latestTotals?.upgrades ?? 0,
      format: 'number' as KpiFormat,
      delta: computeDelta(latestTotals?.upgrades ?? 0, previousTotals?.upgrades ?? 0),
      spark: buildSpark((item) => item.upgrades),
    },
    {
      key: 'downgrades',
      label: 'Downgrades',
      value: latestTotals?.downgrades ?? 0,
      format: 'number' as KpiFormat,
      delta: computeDelta(latestTotals?.downgrades ?? 0, previousTotals?.downgrades ?? 0),
      spark: buildSpark((item) => item.downgrades),
    },
    {
      key: 'churned',
      label: 'Churned Customers',
      value: latestTotals?.churnedCustomers ?? 0,
      format: 'number' as KpiFormat,
      delta: computeDelta(
        latestTotals?.churnedCustomers ?? 0,
        previousTotals?.churnedCustomers ?? 0
      ),
      spark: buildSpark((item) => item.churnedCustomers),
    },
    {
      key: 'coupons',
      label: 'Coupons Redeemed',
      value: latestTotals?.couponsRedeemed ?? 0,
      format: 'number' as KpiFormat,
      delta: computeDelta(
        latestTotals?.couponsRedeemed ?? 0,
        previousTotals?.couponsRedeemed ?? 0
      ),
      spark: buildSpark((item) => item.couponsRedeemed),
    },
    {
      key: 'new-subscriptions',
      label: 'New Subscriptions',
      value: latestTotals?.newMRR ?? 0,
      format: 'currency' as KpiFormat,
      delta: computeDelta(latestTotals?.newMRR ?? 0, previousTotals?.newMRR ?? 0),
      spark: buildSpark((item) => item.newMRR),
    },
    {
      key: 'active-subscriptions',
      label: 'Active Subscriptions',
      value: latestTotals?.activeSubscriptions ?? 0,
      format: 'number' as KpiFormat,
      delta: computeDelta(
        latestTotals?.activeSubscriptions ?? 0,
        previousTotals?.activeSubscriptions ?? 0
      ),
      spark: buildSpark((item) => item.activeSubscriptions),
    },
    {
      key: 'failed',
      label: 'Failed Charges',
      value: latestTotals?.failedCharges ?? 0,
      format: 'currency' as KpiFormat,
      delta: computeDelta(
        latestTotals?.failedCharges ?? 0,
        previousTotals?.failedCharges ?? 0
      ),
      spark: buildSpark((item) => item.failedCharges),
    },
    {
      key: 'refunds',
      label: 'Refunds',
      value: latestTotals?.refunds ?? 0,
      format: 'currency' as KpiFormat,
      delta: computeDelta(latestTotals?.refunds ?? 0, previousTotals?.refunds ?? 0),
      spark: buildSpark((item) => item.refunds),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.key} className="flex flex-col gap-3">
          <CardHeader className="space-y-2">
            <CardTitle>{card.label}</CardTitle>
            <div className="text-2xl font-semibold text-white">
              {renderValue(card.value, card.format)}
            </div>
            <div
              className={cn(
                'text-xs font-semibold uppercase',
                (card.delta ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}
            >
              {formatPercent(card.delta ?? 0)} vs prev month
            </div>
          </CardHeader>
          <CardContent>
            <Sparkline data={card.spark} color="#34d399" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
