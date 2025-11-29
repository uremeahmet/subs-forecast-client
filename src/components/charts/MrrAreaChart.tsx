'use client';

import { useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, TooltipProps } from 'recharts';
import type { Payload } from 'recharts/types/component/DefaultTooltipContent';
import { cn } from '@/lib/cn';
import type { ProjectTimeseriesPoint, TimeseriesPoint } from '@/lib/types';

interface MrrAreaChartProps {
  timeseries: TimeseriesPoint[];
  selectedProjectIds: string[];
}

type MetricKey = keyof Pick<ProjectTimeseriesPoint, 'mrr' | 'activeSubscriptions' | 'arr' | 'cogs'>;

interface ProjectMetricAreaChartProps extends MrrAreaChartProps {
  metric: MetricKey;
  yAxisTickFormatter?: (value: number) => string;
  valueFormatter?: (value: number) => string;
  xAxisTickFormatter?: (value: string) => string;
  labelFormatter?: (value: string) => string;
  enableViewToggle?: boolean;
}
type TooltipPayloadEntry = Payload<number, string>;

interface StackedAreaTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipPayloadEntry[];
  labelFormatter: (value: string) => string;
  valueFormatter: (value: number) => string;
}

const StackedAreaTooltip = ({
  active,
  label,
  payload,
  labelFormatter,
  valueFormatter,
}: StackedAreaTooltipProps) => {
  const entries = payload ?? [];

  if (!active || !entries.length) {
    return null;
  }

  const total = entries.reduce<number>((sum, entry) => sum + Number(entry.value ?? 0), 0);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/90 p-4 text-sm text-white">
      <p className="text-xs uppercase tracking-wide text-white/60">
        {labelFormatter(String(label ?? ''))}
      </p>
      <div className="mt-2 space-y-1">
        {entries.map((entry, index) => (
          <div
            key={String(entry.dataKey ?? entry.name ?? index)}
            className="flex items-center justify-between gap-4 text-xs"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color ?? '#fff' }}
              />
              <span>{entry.name}</span>
            </div>
            <span>{valueFormatter(Number(entry.value ?? 0))}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 border-t border-white/10 pt-2 text-xs font-semibold text-white">
        Total: {valueFormatter(total)}
      </div>
    </div>
  );
};


const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#fb7185', '#38bdf8'];
const TOTAL_COLOR = '#f97316';

const formatDateLabel = (iso: string) => {
  const date = new Date(`${iso}-01`);
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' }).format(date);
};

const selectYearEndSnapshots = (timeseries: TimeseriesPoint[]) => {
  const map = new Map<string, TimeseriesPoint>();
  timeseries.forEach((point) => {
    const year = point.date.slice(0, 4);
    const existing = map.get(year);
    if (!existing || existing.date < point.date) {
      map.set(year, point);
    }
  });
  return Array.from(map.entries())
    .sort(([yearA], [yearB]) => yearA.localeCompare(yearB))
    .map(([, point]) => point);
};

export const ProjectMetricAreaChart = ({
  timeseries,
  selectedProjectIds,
  metric,
  yAxisTickFormatter,
  valueFormatter,
  xAxisTickFormatter,
  labelFormatter,
  enableViewToggle = true,
}: ProjectMetricAreaChartProps) => {
  const [viewMode, setViewMode] = useState<'projects' | 'total'>('projects');

  const data = useMemo(() => timeseries.map((point) => {
    const row: Record<string, number | string> = { date: point.date };
    selectedProjectIds.forEach((id) => {
      row[id] = Number(point.projects[id]?.[metric] ?? 0);
    });
    return row;
  }), [timeseries, selectedProjectIds, metric]);

  const totalData = useMemo(
    () =>
      data.map((row) => {
        const total = selectedProjectIds.reduce(
          (sum, projectId) => sum + Number(row[projectId] ?? 0),
          0
        );
        return { date: String(row.date), total };
      }),
    [data, selectedProjectIds]
  );

  const chartData = viewMode === 'projects' ? data : totalData;
  const seriesKeys = viewMode === 'projects' ? selectedProjectIds : ['total'];

  return (
    <div className="h-80 w-full">
      {enableViewToggle && (
        <div className="mb-3 flex justify-end gap-1 text-xs">
          {(['projects', 'total'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={cn(
                'rounded-full border px-3 py-1 font-semibold uppercase tracking-wide transition',
                viewMode === mode
                  ? 'border-blue-400 bg-blue-500/20 text-white'
                  : 'border-white/20 text-white/60 hover:border-white/40 hover:text-white'
              )}
            >
              {mode === 'projects' ? 'Projects' : 'Total'}
            </button>
          ))}
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tickFormatter={xAxisTickFormatter ?? formatDateLabel}
            stroke="#94a3b8"
            tickLine={false}
          />
          <YAxis
            stroke="#94a3b8"
            tickFormatter={
              yAxisTickFormatter ?? ((value) => value.toLocaleString(undefined, { maximumFractionDigits: 0 }))
            }
          />
          <Tooltip
            content={(props) => (
              <StackedAreaTooltip
                {...(props as TooltipProps<number, string>)}
                labelFormatter={labelFormatter ?? formatDateLabel}
                valueFormatter={valueFormatter ?? ((val) => val.toLocaleString())}
              />
            )}
          />
          {seriesKeys.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stackId={metric}
              stroke={viewMode === 'projects' ? COLORS[index % COLORS.length] : TOTAL_COLOR}
              fill={viewMode === 'projects' ? COLORS[index % COLORS.length] : TOTAL_COLOR}
              fillOpacity={viewMode === 'projects' ? 0.2 : 0.25}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const MrrAreaChart = (props: MrrAreaChartProps) => (
  <ProjectMetricAreaChart
    {...props}
    metric="mrr"
    yAxisTickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
    valueFormatter={(value) => `$${value.toLocaleString()}`}
  />
);

export const ActiveSubscriptionsAreaChart = (props: MrrAreaChartProps) => (
  <ProjectMetricAreaChart
    {...props}
    metric="activeSubscriptions"
    yAxisTickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
    valueFormatter={(value) => value.toLocaleString()}
  />
);

export const ArrAreaChart = ({ timeseries, ...rest }: MrrAreaChartProps) => {
  const yearlySeries = useMemo(() => selectYearEndSnapshots(timeseries), [timeseries]);
  return (
    <ProjectMetricAreaChart
      {...rest}
      timeseries={yearlySeries}
      metric="arr"
      xAxisTickFormatter={(value) => value.slice(0, 4)}
      labelFormatter={(value) => value.slice(0, 4)}
      yAxisTickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
      valueFormatter={(value) => `$${value.toLocaleString()}`}
    />
  );
};
