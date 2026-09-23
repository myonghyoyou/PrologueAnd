import { test, expect } from '@playwright/test';
import { allProjects, publishedProjects, getCase, nextProject } from '../content';

test('프로젝트는 6건이고 공개는 Por favor, Harry 한 건', () => {
  expect(allProjects()).toHaveLength(6);
  expect(publishedProjects().map((p) => p.slug)).toEqual(['por-favor-harry']);
});

test('공개된 상세만 Case 데이터가 있다', () => {
  expect(getCase('por-favor-harry')).toBeTruthy();
  expect(getCase('custom-commerce')).toBeUndefined();
});

test('표지 숫자는 3개이고 06 화면은 6장', () => {
  const c = getCase('por-favor-harry')!;
  expect(c.numbers).toHaveLength(3);
  expect(c.s06.screens).toHaveLength(6);
  expect(c.s07.scatter.length).toBeGreaterThanOrEqual(5);
});

test('다음 이야기는 자기 자신이 아니다', () => {
  expect(nextProject('por-favor-harry')?.slug).not.toBe('por-favor-harry');
});
