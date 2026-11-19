import { describe, expect, it } from 'vitest';
import { parseUsersParam } from './parse-users';

describe('parseUsersParam', () => {
  it('reads two comma-separated users', () => {
    expect(parseUsersParam('gaearon, torvalds')).toEqual(['gaearon', 'torvalds']);
  });

  it('keeps a single user to prefill the form', () => {
    expect(parseUsersParam('gaearon,')).toEqual(['gaearon', '']);
  });

  it('drops invalid names and extra entries', () => {
    expect(parseUsersParam('bad--name,torvalds,third')).toEqual(['', 'torvalds']);
    expect(parseUsersParam(undefined)).toEqual(['', '']);
    expect(parseUsersParam(['a', 'b'])).toEqual(['', '']);
  });
});
