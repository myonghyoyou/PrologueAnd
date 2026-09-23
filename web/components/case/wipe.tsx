'use client';
import { useRef, type CSSProperties } from 'react';
import Image from 'next/image';
import type { WipeBlock } from '@/content';
import { ScatterCollage } from './scatter-collage';
import { useReducedMotion, useScrollProgress } from './use-scroll-progress';
import g from './grid.module.css';
import s from './wipe.module.css';

const PIN = 88;   // wipe.module.css .stage top 과 같게
/** 트랙 윗변이 PIN 에 오면 0, 한 화면 높이(= 트랙 안 .room) 더 내려가면 1 */
const wipeT = (r: DOMRect, vh: number) => (PIN - r.top) / vh;

export function WipeView({ b }: { b: WipeBlock }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const t = useScrollProgress(ref, wipeT, reduced ? 1 : undefined);
  const pct = (100 - t * 100).toFixed(2);
  const ar = (b.after.w! + 12) / (b.after.h! + 12);   // 틀 12(=Frame 옛 공식) 를 더한 After 그림 비율
  return (
    <div className={g.g}>
      <div className={g.wide}>
        <div ref={ref} className={s.track} data-wipe-track>
          <div className={s.stage} data-wipe-stage>
            <div className={s.stack} style={{ '--ar': ar } as CSSProperties}>
              <div data-wipe-before className={s.layer}>
                {Array.isArray(b.before)
                  ? <ScatterCollage items={b.before} />
                  : <Image src={b.before.src} alt={b.before.alt} fill sizes="(max-width:1023px) 100vw, 1343px" className={s.img} />}
              </div>
              <div data-wipe-after className={`${s.layer} ${s.after}`} style={{ clipPath: `inset(0 ${pct}% 0 0)` }}>
                <Image src={b.after.src} alt={b.after.alt} fill sizes="(max-width:1023px) 100vw, 1343px" className={s.img} />
              </div>
              <i aria-hidden data-wipe-edge className={s.edge} style={{ left: `calc(${(t * 100).toFixed(2)}% - 1px)` }} />
            </div>
            <div className={s.caps}>
              <span style={{ opacity: t < 0.5 ? 1 : 0.35 }}>{b.caps[0]}</span>
              <span className={s.arrow} style={{ color: 'var(--bone-400)' }}>→</span>
              <span style={{ opacity: t < 0.5 ? 0.35 : 1 }}>{b.caps[1]}</span>
            </div>
          </div>
          <div aria-hidden className={s.room} />
        </div>
      </div>
    </div>
  );
}
