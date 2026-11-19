import type { ReactNode } from 'react';
import { cn } from 'cn';
import { SeriesKey } from './series-key';

/** Two-column comparison; the higher value is emphasised (weight + a muted wash), with a text cue for screen readers. */
export function CompareTable({
  caption,
  logins,
  children,
}: {
  caption: string;
  logins: [string, string];
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <table className="w-full text-sm">
        <caption className="border-b px-4 py-3 text-left font-medium">{caption}</caption>
        <thead>
          <tr className="border-b text-muted-foreground">
            <th scope="col" className="px-4 py-2 text-left font-normal">
              <span className="sr-only">Metric</span>
            </th>
            {logins.map((login, index) => (
              <th key={login} scope="col" className="px-4 py-2 text-right font-normal">
                <span className="inline-flex items-center gap-1.5">
                  <SeriesKey series={index === 0 ? 1 : 2} />
                  {login}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

interface CompareRowProps {
  label: string;
  values: [number, number];
  format: (value: number) => ReactNode;
}

export function CompareRow({ label, values, format }: CompareRowProps) {
  const [a, b] = values;
  const winner = a === b ? -1 : a > b ? 0 : 1;
  return (
    <tr className="border-b last:border-0">
      <th scope="row" className="px-4 py-2.5 text-left font-normal text-muted-foreground">
        {label}
      </th>
      {values.map((value, index) => (
        <td
          key={index}
          className={cn('px-4 py-2.5 text-right tabular-nums', index === winner && 'bg-muted/60 font-semibold')}
        >
          {format(value)}
          {index === winner ? <span className="sr-only"> (higher)</span> : null}
        </td>
      ))}
    </tr>
  );
}

export function CompareTextRow({ label, values }: { label: string; values: [ReactNode, ReactNode] }) {
  return (
    <tr className="border-b last:border-0">
      <th scope="row" className="px-4 py-2.5 text-left font-normal text-muted-foreground">
        {label}
      </th>
      {values.map((value, index) => (
        <td key={index} className="px-4 py-2.5 text-right">
          {value}
        </td>
      ))}
    </tr>
  );
}
