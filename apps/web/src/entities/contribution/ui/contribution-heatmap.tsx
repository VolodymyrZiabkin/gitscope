'use client';

import type { ContributionDay } from '@gitscope/shared';
import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { cn } from 'cn';
import { formatDate, formatWeekday, pluralize } from '@/shared/lib';
import { buildCalendarGrid } from '../lib/calendar-grid';
import { HEAT_FILL } from './heat-legend';

// Geometry in viewBox units: the SVG scales to the card width and scrolls horizontally below MIN_WIDTH px.
const CELL = 11;
const STEP = CELL + 3;
const LEFT = 28;
const TOP = 16;
const MIN_WIDTH = 680;
const WEEKDAY_LABELS = [
  { row: 1, label: 'Mon' },
  { row: 3, label: 'Wed' },
  { row: 5, label: 'Fri' },
];

type Position = { week: number; weekday: number };

const describe = (day: ContributionDay) =>
  `${pluralize(day.count, 'contribution')} on ${formatWeekday(new Date(`${day.date}T00:00:00Z`).getUTCDay())}, ${formatDate(day.date)}`;

/**
 * GitHub-style calendar as one SVG (370+ cells would be heavy as DOM elements with their own tooltips).
 * Pointer and keyboard share one "active cell": a single tab stop, arrow keys move, a live region announces.
 */
export function ContributionHeatmap({ days, label }: { days: readonly ContributionDay[]; label: string }) {
  const { weeks, months } = buildCalendarGrid(days);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Position | null>(null);
  const [tooltip, setTooltip] = useState<{ left: number; top: number } | null>(null);

  // On narrow screens show the most recent weeks first.
  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollLeft = element.scrollWidth;
  }, [days]);

  const width = LEFT + weeks.length * STEP;
  const height = TOP + 7 * STEP;
  const activeDay = active ? (weeks[active.week]?.[active.weekday] ?? null) : null;

  // The cell is scaled by the viewBox, so the tooltip is placed from its rendered box.
  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const cell = active
      ? scrollRef.current?.querySelector(`[data-week="${active.week}"][data-weekday="${active.weekday}"]`)
      : null;
    if (!wrapper || !cell) {
      setTooltip(null);
      return;
    }
    const cellBox = cell.getBoundingClientRect();
    const wrapperBox = wrapper.getBoundingClientRect();
    setTooltip({ left: cellBox.left - wrapperBox.left + cellBox.width / 2, top: cellBox.top - wrapperBox.top - 6 });
  }, [active]);

  function lastDayPosition(): Position | null {
    for (let week = weeks.length - 1; week >= 0; week--) {
      for (let weekday = 6; weekday >= 0; weekday--) {
        if (weeks[week]?.[weekday]) return { week, weekday };
      }
    }
    return null;
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    const target = event.target as SVGElement;
    const week = target.dataset.week;
    const weekday = target.dataset.weekday;
    if (week !== undefined && weekday !== undefined) setActive({ week: Number(week), weekday: Number(weekday) });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const move = moves[event.key];
    const current = active ?? lastDayPosition();
    if (!move || !current) return;
    event.preventDefault();
    const next = { week: current.week + move[0], weekday: current.weekday + move[1] };
    if (weeks[next.week]?.[next.weekday]) {
      setActive(next);
      scrollIntoView(next.week);
    }
  }

  function scrollIntoView(week: number) {
    const element = scrollRef.current;
    if (!element) return;
    const scale = element.scrollWidth / width;
    const x = (LEFT + week * STEP) * scale;
    const left = LEFT * scale;
    if (x < element.scrollLeft + left) element.scrollLeft = x - left;
    else if (x + STEP * scale > element.scrollLeft + element.clientWidth) {
      element.scrollLeft = x + STEP * scale - element.clientWidth;
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div
        ref={scrollRef}
        role="group"
        aria-label={`${label}. Use arrow keys to move between days.`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onFocus={() => setActive((current) => current ?? lastDayPosition())}
        onBlur={() => setActive(null)}
        onScroll={() => setActive(null)}
        className="overflow-x-auto rounded-md pb-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-auto w-full"
          style={{ minWidth: MIN_WIDTH }}
          aria-hidden
          onPointerMove={onPointerMove}
          onPointerLeave={() => setActive(null)}
        >
          {months.map(({ label: month, week }) => (
            <text key={`${month}-${week}`} x={LEFT + week * STEP} y={10} className="fill-muted-foreground text-[9px]">
              {month}
            </text>
          ))}
          {WEEKDAY_LABELS.map(({ row, label: weekday }) => (
            <text key={weekday} x={0} y={TOP + row * STEP + 9} className="fill-muted-foreground text-[9px]">
              {weekday}
            </text>
          ))}
          {weeks.map((week, weekIndex) =>
            week.map((day, weekday) =>
              day ? (
                <rect
                  key={day.date}
                  data-week={weekIndex}
                  data-weekday={weekday}
                  x={LEFT + weekIndex * STEP}
                  y={TOP + weekday * STEP}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  className={cn(
                    HEAT_FILL[day.level],
                    active?.week === weekIndex && active.weekday === weekday && 'stroke-foreground stroke-[1.5]',
                  )}
                />
              ) : null,
            ),
          )}
        </svg>
      </div>

      {activeDay && tooltip ? (
        <div
          role="presentation"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border bg-popover px-3 py-2 text-xs whitespace-nowrap shadow-md"
          style={tooltip}
        >
          <div className="font-semibold text-foreground">{pluralize(activeDay.count, 'contribution')}</div>
          <div className="text-muted-foreground">{formatDate(activeDay.date)}</div>
        </div>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {activeDay ? describe(activeDay) : ''}
      </p>
    </div>
  );
}
