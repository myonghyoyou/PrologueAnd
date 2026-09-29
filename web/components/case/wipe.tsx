'use client';
import { useRef, type CSSProperties } from 'react';
import Image from 'next/image';
import type { WipeBlock } from '@/content';
import { DayBoard } from './day-board';
import { pinT, usePin } from './pinned';
import { useScrollProgress } from './use-scroll-progress';
import g from './grid.module.css';
import s from './wipe.module.css';

/** Before & After — 장 전체가 헤더 아래에 붙은 동안(pinned.tsx) After 가 왼쪽부터 드러난다.
 *  붙지 않을 때(폰·모션 줄이기)는 끝 상태: 폰은 CSS 가 둘을 쌓고, 모션 줄이기는 After 전부 */
export function WipeView({ b }: { b: WipeBlock }) {
  const own = useRef<HTMLDivElement>(null);
  const pin = usePin();
  const t = useScrollProgress(pin?.ref ?? own, pinT, pin?.on ? undefined : 1);
  const pct = (100 - t * 100).toFixed(2);
  const ar = (b.after.w! + 12) / (b.after.h! + 12);   // 틀 12(=Frame 옛 공식) 를 더한 After 그림 비율
  return (
    <div className={g.g}>
      <div ref={own} className={g.wide} data-wipe>
        <div className={s.stack} style={{ '--ar': ar } as CSSProperties}>
          <div data-wipe-before className={s.layer}>
            {Array.isArray(b.before)
              ? <DayBoard items={b.before} mark={b.mark} />
              : <Image src={b.before.src} alt={b.before.alt} fill sizes="(max-width:1023px) 100vw, 1343px" className={s.img} />}
          </div>
          <div data-wipe-after className={`${s.layer} ${s.after}`} style={{ clipPath: `inset(0 ${pct}% 0 0)` }}>
            <Image src={b.after.src} alt={b.after.alt} fill sizes="(max-width:1023px) 100vw, 1343px" className={s.img} />
          </div>
        </div>
        <div className={s.caps}>
          <span style={{ opacity: t < 0.5 ? 1 : 0.35 }}>{b.caps[0]}</span>
          <span className={s.arrow} style={{ color: 'var(--bone-400)' }}>→</span>
          <span style={{ opacity: t < 0.5 ? 0.35 : 1 }}>{b.caps[1]}</span>
        </div>
      </div>
    </div>
  );
}
