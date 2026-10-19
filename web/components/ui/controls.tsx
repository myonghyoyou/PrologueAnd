import type { ChangeEvent, ReactNode } from 'react';
import ui from './ui.module.css';

/** 사이트 공통 고르기 부품 — 제어(요청서)·비제어(문의 서랍) 둘 다. 고름 표시는 CSS(:has)가 그린다 */
type Input = { type: 'radio' | 'checkbox'; name?: string; value?: string; checked?: boolean; defaultChecked?: boolean; onChange?: (e: ChangeEvent<HTMLInputElement>) => void };

/** 괘선 줄 + 왼쪽 표시(라디오 점·체크 네모) */
export function ChoiceRow({ children, ...input }: Input & { children: ReactNode }) {
  return (
    <label className={ui.choice} data-choice>
      <input className={ui.native} {...input} />
      <span className={input.type === 'radio' ? ui.dot : ui.box} data-mark aria-hidden="true" />
      <span className={ui.lb}>{children}</span>
    </label>
  );
}

/** 각진 외곽선 칸 */
export function Tag({ children, ...input }: Input & { children: ReactNode }) {
  return (
    <label className={ui.tag} data-tag>
      <input className={ui.native} {...input} />
      <span>{children}</span>
    </label>
  );
}

/** 디돈 숫자 — 단계·단원 번호(01, 02 …) */
export function Num({ n, className }: { n: number; className?: string }) {
  return <span className={className ? `${ui.num} ${className}` : ui.num} data-numeral>{String(n).padStart(2, '0')}</span>;
}

export { ui };
