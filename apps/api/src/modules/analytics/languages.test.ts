import { describe, expect, it } from 'vitest';
import { aggregateLanguages, OTHER_LANGUAGE } from './languages';

const ts = (bytes: number) => ({ name: 'TypeScript', color: '#3178c6', bytes });
const css = (bytes: number) => ({ name: 'CSS', color: '#663399', bytes });
const lang = (name: string, bytes: number) => ({ name, color: null, bytes });

describe('aggregateLanguages', () => {
  it('sums bytes across repositories and sorts by size', () => {
    const result = aggregateLanguages([[ts(600), css(100)], [css(300)]]);
    expect(result).toEqual([
      { name: 'TypeScript', color: '#3178c6', bytes: 600, share: 0.6 },
      { name: 'CSS', color: '#663399', bytes: 400, share: 0.4 },
    ]);
  });

  it('folds languages beyond the limit into "Other"', () => {
    const result = aggregateLanguages([[lang('A', 50), lang('B', 30), lang('C', 15), lang('D', 5)]], 2);
    expect(result.map(({ name, bytes }) => [name, bytes])).toEqual([
      ['A', 50],
      ['B', 30],
      [OTHER_LANGUAGE, 20],
    ]);
    expect(result.reduce((sum, language) => sum + language.share, 0)).toBeCloseTo(1);
  });

  it('breaks ties by name for a stable order', () => {
    expect(aggregateLanguages([[lang('Rust', 10), lang('Go', 10)]]).map((language) => language.name)).toEqual([
      'Go',
      'Rust',
    ]);
  });

  it('returns an empty list when there is no code', () => {
    expect(aggregateLanguages([])).toEqual([]);
    expect(aggregateLanguages([[], [lang('Empty', 0)]])).toEqual([]);
  });
});
