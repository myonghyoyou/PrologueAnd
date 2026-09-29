import type { Scatter, Spot } from './types';

/** 그림 한 장. w·h 는 쓰지 않는다 — resolveStudy 가 public/ 의 파일에서 읽어 채운다 */
export type Figure = { src: string; alt: string; caption?: string; spots?: Spot[]; w?: number; h?: number };
export type Num = { value: string; label: string; small?: string };

export type FigureBlock = { type: 'figure'; slot: 'wide' | 'body'; fig: Figure };
/** play: 데스크톱에서 캡처 대신 HTML 로 다시 그린 화면이 스크롤에 맞춰 움직인다(폰·모션 줄이기는 캡처 그대로) */
/** was: 이 화면이 없던 때의 모습 한 줄 — 제목 위에 "전에는"으로 붙어 개선을 비교할 기준이 된다.
 *  beforeFig: 있으면 그림 위 "후 · 전" 단추로 1차 화면을 같은 틀에서 보인다 */
export type NoteBlock = { type: 'note'; label?: string; was?: string; h?: string; p?: string[]; figs: Figure[]; beforeFig?: Figure; play?: 'pfh-request-form' };
export type PhonesBlock = { type: 'phones'; label?: string; was?: string; h?: string; p?: string[]; figs: Figure[]; caption?: string };
export type FlowBlock = {
  type: 'flow'; state: 'before' | 'morph';
  from: string[];   // 흩어진 갈래(2~5개)
  hub: string;      // before: 갈래가 모이는 곳
  stop: string;     // before: 끝의 × 자리
  to: string[];     // morph: 새 흐름의 단계(2~6개)
  alt: string; caption?: string;
};
export type QuoteBlock = { type: 'quote'; text: string; p?: string };
/** before 가 요청 목록이면 어느 하루 판(day-board)으로 그린다. mark: 같은 요청을 알아볼 낱말 */
export type WipeBlock = { type: 'wipe'; before: Scatter[] | Figure; mark?: string; after: Figure; caps: [string, string] };
/** 같은 요청이 여러 번 온 장면 — 시각 순서대로, 사이에 흐른 시간이 붙는다 */
export type ThreadBlock = { type: 'thread'; items: Scatter[]; mark?: string; caption?: string };   // mark: 메시지마다 표시할 같은 낱말
/** 원본 대비 % 영역만 보이는 캡처 — 파일을 새로 자르지 않는다 */
export type Crop = Figure & { crop: { x: number; y: number; w: number; h: number } };
/** 표 칸: 글자, 또는 색 견본 + 이름(hex 는 견본 옆에 옅게) */
export type TableCell = string | { swatch: string; text: string };
export type TableBlock = { type: 'table'; cols: string[]; rows: TableCell[][]; foot?: TableCell[]; caption?: string };
export type SheetShow =
  | { swatches: { hex: string; name: string }[] }
  | { crop: Crop }
  | { heights: number[] }
  | { buttons: { text: string; kind: 'primary' | 'secondary' | 'danger' }[] }
  | { frame: string[] };
export type SheetCell = { label: string; show: SheetShow };
export type SheetRow = { rule: string; before: SheetCell; after: SheetCell };
/** 규칙 시트 — 행마다 규칙 한 줄, 그 아래 전(1차 화면에서 뽑음) · 후(정한 규칙) */
export type SheetBlock = { type: 'sheet'; rows: SheetRow[]; caption?: string };
/** 적용 한 쌍 — 같은 부분을 자른 전·후 캡처 */
export type RuleBlock = { type: 'rule'; h: string; p?: string; before: Crop; after: Crop };
export type Block = FigureBlock | NoteBlock | PhonesBlock | FlowBlock | QuoteBlock | WipeBlock | ThreadBlock | TableBlock | SheetBlock | RuleBlock;

/** 표지 그림을 결과 화면 대신 문제 장면(흩어진 요청 더미)으로 — 문제를 먼저 보여 준다 */
export type ScatterHero = { scatter: Scatter[]; mark?: string; alt: string; caption?: string };
/** 표지 그림: 1차 화면 한 장에 번호를 찍고, 그림 아래에 번호 설명 */
export type PinnedHero = { pinned: Figure; pins: { x: number; y: number; text: string }[] };
export type Hero = Figure | ScatterHero | PinnedHero;
export const isScatterHero = (h: Hero): h is ScatterHero => 'scatter' in h;
export const isPinnedHero = (h: Hero): h is PinnedHero => 'pinned' in h;
/** 틀에 들어가는 캡처(한 장 또는 번호 한 장). 어느 하루 판이면 null */
export const heroFigure = (h: Hero): Figure | null => (isScatterHero(h) ? null : isPinnedHero(h) ? h.pinned : h);

/** 장 — id 는 주소(#problem), name 은 왼쪽 라벨 칸. 번호는 순서대로 자동 */
export type Chapter = { id: string; name: string; h: string; p: string[]; blocks: Block[] };

/** 한 편 = 표지 + 장 N개 + 끝. 다음 이야기는 목록 순서로 정한다 */
export type Study = {
  /** 윗줄은 프로젝트 이름만 쓴다(목록에서 가져옴). numbers 는 없거나 3개 */
  cover: { title: string; summary: string[]; numbers?: Num[]; hero: Hero };
  chapters: Chapter[];
  builtWith?: string[];
  cta: string;
};
