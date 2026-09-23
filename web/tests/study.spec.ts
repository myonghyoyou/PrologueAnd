import { test, expect } from '@playwright/test';
import { getStudy } from '../content';
import { validateStudy } from '../content/validate';
import { resolveStudy } from '../content/resolve';
import { figuresOf } from '../content/figures';
import type { Study } from '../content/study-types';
import { frameMode, rowMaxWidth } from '../lib/figure-rules';

const pfh = () => getStudy('por-favor-harry')!;

test('Por favor, Harry 는 콘텐츠 규칙을 지킨다', () => {
  expect(validateStudy(pfh())).toEqual([]);
});

test('장 네 개: 문제 · 바꾼 흐름 · 화면 · Before & After', () => {
  const s = pfh();
  expect(s.chapters.map((c) => c.id)).toEqual(['problem', 'flow', 'screens', 'before-after']);
  const screens = s.chapters[2].blocks.map((b) => b.type);
  expect(screens).toEqual(['note', 'note', 'note', 'note', 'note', 'note', 'phones']);
  expect(s.cover.numbers).toHaveLength(3);
});

test('규칙을 어기면 이유를 돌려준다', () => {
  const bad: Study = structuredClone(pfh());
  bad.chapters[0].id = '문제';
  const wipe = bad.chapters[3].blocks[0];
  bad.chapters[3].blocks.push(structuredClone(wipe));
  const note = bad.chapters[2].blocks[1];
  if (note.type !== 'note') throw new Error('03 두 번째 블록은 note 여야 한다');
  note.figs = [note.figs[0], note.figs[0], note.figs[0], note.figs[0]];
  note.p = ['하나입니다. 둘입니다. 셋입니다.'];
  const pair = bad.chapters[2].blocks[4];
  if (pair.type !== 'note') throw new Error('03 다섯 번째 블록은 note 여야 한다');
  pair.figs[1] = { ...pair.figs[1], spots: [{ x: 1, y: 1, w: 1, h: 1, cap: '두 번째 그림의 핫스팟' }] };
  bad.cover.hero = { ...bad.cover.hero, alt: ' ' };
  const errs = validateStudy(bad).join('\n');
  expect(errs).toContain('장 id');
  expect(errs).toContain('와이프는 한 편에 하나까지');
  expect(errs).toContain('그림은 1~3장');
  expect(errs).toContain('두 문장 이하');
  expect(errs).toContain('핫스팟은 여백 주석의 첫 그림에만');
  expect(errs).toContain('alt 가 비었습니다');
});

test('그림 크기는 파일에서 읽는다', () => {
  const figs = figuresOf(resolveStudy(pfh()));
  expect(figs.every((f) => (f.w ?? 0) > 0 && (f.h ?? 0) > 0)).toBe(true);
  expect(figs.find((f) => f.src.endsWith('/form.png'))).toMatchObject({ w: 1280, h: 800 });
  expect(figs.find((f) => f.src.endsWith('/mobile.png'))).toMatchObject({ w: 390, h: 844 });
});

test('없는 그림 파일은 오류', () => {
  const s = pfh();
  const missing: Study = { ...s, cover: { ...s.cover, hero: { ...s.cover.hero, src: '/screens/pfh/없는-파일.png' } } };
  expect(() => resolveStudy(missing)).toThrow();
});

test('그림 규칙: 세로로 긴 캡처만 창, 폰 칸은 아님', () => {
  expect(frameMode(1280, 800, 'block')).toBe('plain');
  expect(frameMode(1280, 1600, 'block')).toBe('long');
  expect(frameMode(390, 844, 'phones')).toBe('plain');
});

test('그림 규칙: 한 줄의 최대 폭은 가장 낮은 원본 높이에서 정해진다', () => {
  // 1280×800 두 장, 간격 12 → 높이 800 에서 폭 1280 두 장 + 틀 여백 7×2×2 + 간격 12
  expect(rowMaxWidth([{ w: 1280, h: 800 }, { w: 1280, h: 800 }], 12)).toBe(1280 * 2 + 28 + 12);
  // 높이가 낮은 쪽(720)이 상한을 정한다
  expect(rowMaxWidth([{ w: 1280, h: 800 }, { w: 1280, h: 720 }], 12)).toBe(Math.round(720 * (1.6 + 1280 / 720)) + 28 + 12);
});
