'use client';

import type { Contributions } from '@gitscope/shared';
import { useQueries } from '@tanstack/react-query';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts';
import { contributionsQuery } from '@/entities/contribution';
import { formatAxisTick, formatInteger, formatMonthYear, formatShortMonth, pluralize } from '@/shared/lib';
import { ChartContainer, type ChartConfig } from '@/shared/ui/chart';
import { CompareRow, CompareTable } from '@/shared/ui/compare-table';
import { SeriesKey } from '@/shared/ui/series-key';
import { Skeleton } from '@/shared/ui/skeleton';

const config = {
  first: { label: 'First', color: 'var(--chart-1)' },
  second: { label: 'Second', color: 'var(--chart-2)' },
} satisfies ChartConfig;

type Point = { month: string; first: number; second: number };

function mergeMonthly(first: Contributions, second: Contributions): Point[] {
  const months = new Map<string, Point>();
  for (const { month, count } of first.monthly) months.set(month, { month, first: count, second: 0 });
  for (const { month, count } of second.monthly) {
    const point = months.get(month) ?? { month, first: 0, second: 0 };
    months.set(month, { ...point, second: count });
  }
  return [...months.values()].sort((a, b) => a.month.localeCompare(b.month));
}

function MonthTooltip({ active, payload, label, names }: Partial<TooltipContentProps> & { names: [string, string] }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="text-muted-foreground">{formatMonthYear(String(label))}</div>
      {payload.map((entry) => (
        <div key={String(entry.dataKey)} className="flex items-center gap-2">
          <SeriesKey series={entry.dataKey === 'first' ? 1 : 2} />
          <span className="font-semibold text-foreground">{formatInteger(Number(entry.value))}</span>
          <span className="text-muted-foreground">{entry.dataKey === 'first' ? names[0] : names[1]}</span>
        </div>
      ))}
    </div>
  );
}

/** Last 12 months of both users: metrics plus a two-line chart (one axis, legend, crosshair tooltip). */
export function CompareActivity({ logins }: { logins: [string, string] }) {
  const [first, second] = useQueries({
    queries: logins.map((login) => contributionsQuery.options(login, null)),
  });

  if (first?.isError || second?.isError) {
    return (
      <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        Contribution activity could not be loaded.
      </p>
    );
  }
  if (!first?.data || !second?.data) {
    return <Skeleton className="h-[420px] rounded-xl" aria-label="Loading activity" />;
  }

  const a = first.data;
  const b = second.data;
  const data = mergeMonthly(a, b);
  const [nameA, nameB] = logins;

  return (
    <div className="flex flex-col gap-4">
      <CompareTable caption="Activity in the last 12 months" logins={logins}>
        <CompareRow label="Contributions" values={[a.total, b.total]} format={formatInteger} />
        <CompareRow label="Active days" values={[a.activeDays, b.activeDays]} format={formatInteger} />
        <CompareRow
          label="Longest streak"
          values={[a.streaks.longest?.length ?? 0, b.streaks.longest?.length ?? 0]}
          format={(value) => pluralize(value, 'day')}
        />
        <CompareRow
          label="Current streak"
          values={[a.streaks.current, b.streaks.current]}
          format={(value) => pluralize(value, 'day')}
        />
      </CompareTable>

      <figure className="flex flex-col gap-3 rounded-xl border bg-card p-4">
        <figcaption className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium">
          Contributions per month
          <span className="flex items-center gap-4 text-xs font-normal text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <SeriesKey series={1} />
              {nameA}
            </span>
            <span className="flex items-center gap-1.5">
              <SeriesKey series={2} />
              {nameB}
            </span>
          </span>
        </figcaption>
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }} accessibilityLayer>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis
              dataKey="month"
              tickFormatter={formatShortMonth}
              tickLine={false}
              axisLine={{ stroke: 'var(--chart-grid)' }}
              tickMargin={8}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={44} tickFormatter={formatAxisTick} />
            <Tooltip
              cursor={{ stroke: 'var(--chart-axis)', strokeWidth: 1 }}
              content={<MonthTooltip names={logins} />}
            />
            <Line
              dataKey="first"
              stroke="var(--color-first)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
              isAnimationActive={false}
            />
            <Line
              dataKey="second"
              stroke="var(--color-second)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
        <table className="sr-only">
          <caption>Contributions per month</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">{nameA}</th>
              <th scope="col">{nameB}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.month}>
                <th scope="row">{formatMonthYear(point.month)}</th>
                <td>{point.first}</td>
                <td>{point.second}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figure>
    </div>
  );
}
