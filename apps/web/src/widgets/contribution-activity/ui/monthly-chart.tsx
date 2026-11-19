'use client';

import type { Contributions } from '@gitscope/shared';
import { Bar, BarChart, CartesianGrid, LabelList, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts';
import { formatCompact, formatInteger, formatMonthYear, formatShortMonth, pluralize } from '@/shared/lib';
import { ChartContainer, type ChartConfig } from '@/shared/ui/chart';

const config = { count: { label: 'Contributions', color: 'var(--chart-1)' } } satisfies ChartConfig;

function MonthTooltip({ active, payload }: TooltipContentProps) {
  const entry = payload[0];
  if (!active || !entry) return null;
  const { month, count } = entry.payload as { month: string; count: number };
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="font-semibold text-foreground">{pluralize(count, 'contribution')}</div>
      <div className="text-muted-foreground">{formatMonthYear(month)}</div>
    </div>
  );
}

/** Single series → one colour, no legend; only the peak month is labelled, the rest live in the tooltip and table. */
export function MonthlyChart({ monthly }: { monthly: Contributions['monthly'] }) {
  const max = Math.max(0, ...monthly.map((entry) => entry.count));
  const data = monthly.map((entry) => ({ ...entry, peak: max > 0 && entry.count === max ? formatCompact(max) : '' }));

  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="text-sm font-medium">Contributions per month</figcaption>
      <ChartContainer config={config} className="aspect-auto h-56 w-full">
        <BarChart data={data} margin={{ top: 20, right: 4, bottom: 0, left: -8 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="month"
            tickFormatter={formatShortMonth}
            tickLine={false}
            axisLine={{ stroke: 'var(--chart-grid)' }}
            tickMargin={8}
            interval="preserveStartEnd"
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} tickFormatter={formatCompact} />
          <Tooltip cursor={{ fill: 'var(--muted)' }} content={MonthTooltip} />
          <Bar
            dataKey="count"
            fill="var(--color-count)"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
            isAnimationActive={false}
          >
            <LabelList dataKey="peak" position="top" className="fill-foreground text-xs font-medium" />
          </Bar>
        </BarChart>
      </ChartContainer>
      <table className="sr-only">
        <caption>Contributions per month</caption>
        <tbody>
          {monthly.map(({ month, count }) => (
            <tr key={month}>
              <th scope="row">{formatMonthYear(month)}</th>
              <td>{formatInteger(count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
