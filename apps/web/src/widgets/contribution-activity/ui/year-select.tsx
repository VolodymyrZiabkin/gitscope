'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

const ROLLING = 'rolling';

interface YearSelectProps {
  years: readonly number[];
  /** `null` — the rolling last 12 months. */
  value: number | null;
  onChange: (year: number | null) => void;
}

export function YearSelect({ years, value, onChange }: YearSelectProps) {
  const items = [
    { value: ROLLING, label: 'Last 12 months' },
    ...years.map((year) => ({ value: String(year), label: String(year) })),
  ];

  return (
    <Select
      items={items}
      value={value === null ? ROLLING : String(value)}
      onValueChange={(next) => {
        if (next) onChange(next === ROLLING ? null : Number(next));
      }}
    >
      <SelectTrigger aria-label="Contribution period" className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
