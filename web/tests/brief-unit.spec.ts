import { test, expect } from '@playwright/test';
import { emptyAnswers } from '../lib/brief/storage';
import { visibleSteps, REQUIRED, isAnswered } from '../lib/brief/steps';

test.describe('단계', () => {
  test('새로 만들기면 renew 단계가 없고 15개 중 14개', () => {
    const a = { ...emptyAnswers(), mode: 'new' as const };
    const s = visibleSteps(a);
    expect(s).not.toContain('renew');
    expect(s[0]).toBe('mode');
    expect(s.at(-1)).toBe('when');
    expect(s).toHaveLength(14);
  });
  test('고치기면 mode 다음이 renew', () => {
    const s = visibleSteps({ ...emptyAnswers(), mode: 'renew' });
    expect(s.slice(0, 2)).toEqual(['mode', 'renew']);
    expect(s).toHaveLength(15);
  });
  test('필수는 kind·goal 둘', () => {
    expect(REQUIRED).toEqual(['kind', 'goal']);
    const a = emptyAnswers();
    expect(isAnswered(a, 'kind')).toBe(false);
    expect(isAnswered({ ...a, kind: '가게(식당·카페 등)' }, 'kind')).toBe(true);
    expect(isAnswered({ ...a, kind: '직접 입력', kindOther: '' }, 'kind')).toBe(false);
    expect(isAnswered({ ...a, goalMain: '예약하기' }, 'goal')).toBe(true);
  });
});
