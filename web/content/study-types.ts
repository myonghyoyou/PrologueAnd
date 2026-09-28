import type { Scatter, Spot } from './types';

/** 그림 한 장. w·h 는 쓰지 않는다 — resolveStudy 가 public/ 의 파일에서 읽어 채운다 */
export type Figure = { src: string; alt: string; caption?: string; spots?: Spot[]; w?: number; h?: number };
export type Num = { value: string; label: string; small?: string };

export type FigureBlock = { type: 'figure'; slot: 'wide' | 'body'; fig: Figure };
/** play: 데스크톱에서 캡처 대신 HTML 로 다시 그린 화면이 스크롤에 맞춰 움직인다(폰·모션 줄이기는 캡처 그대로) */
export type NoteBlock = { type: 'note'; label?: string; h?: string; p?: string[]; figs: Figure[]; play?: 'pfh-request-form' };
export type PhonesBlock = { type: 'phones'; label?: string; h?: string; p?: string[]; figs: Figure[]; caption?: string };
export type FlowBlock = {
  type: 'flow'; state: 'before' | 'morph';
  from: string[];   // 흩어진 갈래(2~5개)
  hub: string;      // before: 갈래가 모이는 곳
  stop: string;     // before: 끝의 × 자리
  to: string[];     // morph: 새 흐름의 단계(2~6개)
  alt: string; caption?: string;
};
export type QuoteBlock = { type: 'quote'; text: string; p?: string };
export type WipeBlock = { type: 'wipe'; before: Scatter[] | Figure; after: Figure; caps: [string, string] };
export type Block = FigureBlock | NoteBlock | PhonesBlock | FlowBlock | QuoteBlock | WipeBlock;

/** 장 — id 는 주소(#problem), name 은 왼쪽 라벨 칸. 번호는 순서대로 자동 */
export type Chapter = { id: string; name: string; h: string; p: string[]; blocks: Block[] };

/** 한 편 = 표지 + 장 N개 + 끝. 다음 이야기는 목록 순서로 정한다 */
export type Study = {
  /** 윗줄은 프로젝트 이름만 쓴다(목록에서 가져옴). numbers 는 없거나 3개 */
  cover: { title: string; summary: string[]; meta: [string, string][]; numbers?: Num[]; hero: Figure };
  chapters: Chapter[];
  builtWith?: string[];
  cta: string;
};
