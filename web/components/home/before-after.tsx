'use client';
import Image from 'next/image';
import { useRef } from 'react';
import type { Shot } from './copy';
import s from './home.module.css';

/** 전·후 비교(시그니처 4) — 후 화면 위에 전 화면을 겹치고, 가운데 선을 옮겨 같은 자리를 비교한다.
 *  홈의 장면에서는 스크롤이 가운데 선을 옮기다가, 손으로 한 번 옮기면(data-touched) 그때부터는 손이 정한다.
 *  손잡이는 진짜 range 입력이라 키보드(←→)·터치·화면 읽기에서 그대로 쓴다. 상태는 CSS 변수 하나(--x)만 바꾼다 */
export function BeforeAfter({ before, after, marks }: { before: Shot; after: Shot; marks?: { x: number; y: number }[] }) {
  const box = useRef<HTMLDivElement>(null);
  return (
    <figure className={s.fig}>
      <div ref={box} className={s.ba} data-ba style={{ ['--x' as string]: '50%' }}>
        <Image src={after.src} alt={after.alt} width={after.w} height={after.h} sizes="(min-width:1024px) 62vw, 100vw" className={s.baImg} />
        <div className={s.baBefore}>
          <Image src={before.src} alt={before.alt} width={before.w} height={before.h} sizes="(min-width:1024px) 62vw, 100vw" className={s.baImg} />
        </div>
        {marks?.map((m, i) => <span key={i} className={s.baMark} style={{ left: `${m.x}%`, top: `${m.y}%` }} aria-hidden="true">{i + 1}</span>)}
        <span className={s.baLine} aria-hidden="true"><i /></span>
        <span className={`${s.baTag} ${s.baL}`} aria-hidden="true">전</span>
        <span className={`${s.baTag} ${s.baR}`} aria-hidden="true">후</span>
        <input type="range" min={0} max={100} step={1} defaultValue={50} className={s.baRange} aria-label="전·후 비교 위치. 왼쪽으로 옮기면 후 화면이, 오른쪽으로 옮기면 전 화면이 더 보입니다"
               onInput={(e) => { const b = box.current; if (!b) return; b.dataset.touched = ''; b.style.setProperty('--x', `${(e.target as HTMLInputElement).value}%`); }} />
      </div>
      <figcaption className={s.cap}>왼쪽은 1차 화면, 오른쪽은 규칙을 적용한 화면입니다. 가운데 선을 옮기면 같은 자리를 비교할 수 있습니다.</figcaption>
    </figure>
  );
}
