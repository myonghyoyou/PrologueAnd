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

test('병원 UI/UX 고도화도 콘텐츠 규칙을 지킨다', () => {
  expect(validateStudy(getStudy('hospital-ux')!)).toEqual([]);
});

test('장 네 개: 문제 → Before & After → 바꾼 흐름 → 화면 (문제를 먼저, 해결은 그다음)', () => {
  const s = pfh();
  expect(s.chapters.map((c) => c.id)).toEqual(['problem', 'before-after', 'flow', 'screens']);
  const screens = s.chapters[3].blocks.map((b) => b.type);
  expect(screens).toEqual(['note', 'note', 'note', 'note', 'note', 'note', 'phones']);
  expect(s.cover.numbers ?? []).toHaveLength(0);
});

test('규칙을 어기면 이유를 돌려준다', () => {
  const bad: Study = structuredClone(pfh());
  bad.chapters[0].id = '문제';
  const wipe = bad.chapters[1].blocks[0];
  bad.chapters[1].blocks.push(structuredClone(wipe));
  const note = bad.chapters[3].blocks[1];
  if (note.type !== 'note') throw new Error('03 두 번째 블록은 note 여야 한다');
  note.figs = [note.figs[0], note.figs[0], note.figs[0], note.figs[0]];
  note.p = ['하나입니다. 둘입니다. 셋입니다.'];
  const pair = bad.chapters[3].blocks[4];
  if (pair.type !== 'note') throw new Error('03 다섯 번째 블록은 note 여야 한다');
  pair.figs[1] = { ...pair.figs[1], spots: [{ x: 1, y: 1, w: 1, h: 1, cap: '두 번째 그림의 핫스팟' }] };
  bad.cover.hero = { ...bad.cover.hero, alt: ' ' };
  bad.cover.numbers = [{ value: '1', label: '하나' }, { value: '2', label: '둘' }];
  const errs = validateStudy(bad).join('\n');
  expect(errs).toContain('장 id');
  expect(errs).toContain('와이프는 한 편에 하나까지');
  expect(errs).toContain('그림은 1~3장');
  expect(errs).toContain('두 문장 이하');
  expect(errs).toContain('핫스팟은 여백 주석의 첫 그림에만');
  expect(errs).toContain('alt 가 비었습니다');
  expect(errs).toContain('표지 숫자는 없거나 3개');
});

test('그림 크기는 파일에서 읽는다', () => {
  const figs = figuresOf(resolveStudy(pfh()));
  expect(figs.every((f) => (f.w ?? 0) > 0 && (f.h ?? 0) > 0)).toBe(true);
  expect(figs.find((f) => f.src.endsWith('/form.png'))).toMatchObject({ w: 2560, h: 2136 });   // 2026-09-28 재촬영(폼 카드 전체, DPR 2)
  expect(figs.find((f) => f.src.endsWith('/queue.png'))).toMatchObject({ w: 1280, h: 800 });
  expect(figs.find((f) => f.src.endsWith('/mobile.png'))).toMatchObject({ w: 390, h: 844 });
});

test('없는 그림 파일은 오류', () => {
  const missing: Study = structuredClone(pfh());
  const note = missing.chapters[3].blocks[1];
  if (note.type !== 'note') throw new Error('04 두 번째 블록은 note 여야 한다');
  note.figs[0] = { ...note.figs[0], src: '/screens/pfh/없는-파일.png' };
  expect(() => resolveStudy(missing)).toThrow();
});

test('표지 그림은 결과 화면이 아니라 문제 장면, 01 장은 같은 요청이 세 번 온 장면으로 시작한다', () => {
  const s = pfh();
  expect('scatter' in s.cover.hero).toBe(true);
  const first = s.chapters[0].blocks[0];
  if (first.type !== 'thread') throw new Error('01 첫 블록은 thread 여야 한다');
  expect(first.items).toHaveLength(3);
  expect(first.items.every((m) => m.text.includes('단가표'))).toBe(true);
  // 화면 장의 주석은 모두 "전에는"이 있다
  expect(s.chapters[3].blocks.every((b) => (b.type === 'note' || b.type === 'phones') && !!b.was)).toBe(true);
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

test('새 블록 검증: 표 칸 수, 시트 행 수, 자르기 범위, 표지 번호', () => {
  const bad: Study = structuredClone(pfh());
  bad.cover.hero = { pinned: { src: '/screens/pfh/queue.png', alt: '대시보드' }, pins: [{ x: 120, y: 10, text: '밖' }] };
  const crop = { src: '/screens/pfh/queue.png', alt: '부분', crop: { x: 90, y: 0, w: 20, h: 10 } };
  bad.chapters[0].blocks.push(
    { type: 'table', cols: ['a', 'b'], rows: [['1']] },
    { type: 'sheet', rows: [{ rule: '하나', before: { label: '전', show: { heights: [28] } }, after: { label: '후', show: { crop } } }] },
    { type: 'rule', h: '한 쌍', before: crop, after: crop },
  );
  const errs = validateStudy(bad).join('\n');
  expect(errs).toContain('표지 번호');
  expect(errs).toContain('표 칸 수');
  expect(errs).toContain('시트 행');
  expect(errs).toContain('자르기 범위');
});

test('새 그림도 크기를 파일에서 읽는다(자른 캡처·전 캡처·번호 한 장)', () => {
  const s: Study = structuredClone(pfh());
  s.cover.hero = { pinned: { src: '/screens/pfh/queue.png', alt: '대시보드' }, pins: [{ x: 10, y: 10, text: '하나' }] };
  const note = s.chapters[3].blocks[1];
  if (note.type !== 'note') throw new Error('04 두 번째 블록은 note 여야 한다');
  note.beforeFig = { src: '/screens/pfh/tasks.png', alt: '전' };
  s.chapters[0].blocks.push({ type: 'rule', h: '한 쌍',
    before: { src: '/screens/pfh/form.png', alt: '전', crop: { x: 0, y: 0, w: 50, h: 50 } },
    after: { src: '/screens/pfh/queue.png', alt: '후', crop: { x: 0, y: 0, w: 50, h: 50 } } });
  const figs = figuresOf(resolveStudy(s));
  expect(figs.every((f) => (f.w ?? 0) > 0 && (f.h ?? 0) > 0)).toBe(true);
  expect(figs.some((f) => f.src.endsWith('/tasks.png') && f.alt === '전')).toBe(true);
  expect(figs.filter((f) => f.src.endsWith('/form.png')).length).toBeGreaterThanOrEqual(1);
});
