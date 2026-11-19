/** `?year=` is honoured only for a year the user has contributions in; anything else means the rolling year. */
export function parseYearParam(value: string | string[] | undefined, years: readonly number[]): number | null {
  if (typeof value !== 'string' || !/^\d{4}$/.test(value)) return null;
  const year = Number(value);
  return years.includes(year) ? year : null;
}
