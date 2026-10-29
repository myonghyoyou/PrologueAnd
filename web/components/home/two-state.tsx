'use client';
import Image from 'next/image';
import { useState } from 'react';
import type { Shot } from './copy';
import s from './home.module.css';

/** 두 화면 전환 — 실제 제품의 두 상태를 단추로 바꿔 본다(사례 상세의 전환 단추와 같은 방식: 0.2초 교차, 틀은 첫 그림 비율로 고정).
 *  단추는 aria-pressed, 바뀐 화면의 설명은 캡션이 바로 읽어 준다(aria-live) */
export function TwoState({ names, shots, sizes }: { names: [string, string]; shots: [Shot, Shot]; sizes: string }) {
  const [k, setK] = useState(0);
  const [a] = shots;
  return (
    <figure className={s.fig} data-two>
      <div className={s.twoBtns} role="group" aria-label="화면 바꿔 보기">
        {names.map((n, i) => (
          <button key={n} type="button" className={s.twoBtn} aria-pressed={k === i} onClick={() => setK(i)}>{n}</button>
        ))}
      </div>
      <div className={s.frame} style={{ aspectRatio: `${a.w} / ${a.h}` }}>
        <div className={s.twoStage}>
          {shots.map((sh, i) => (
            <div key={sh.src} className={s.twoShot} data-on={k === i ? '' : undefined} aria-hidden={k !== i} data-zoom={sh.src} data-zoom-alt={sh.alt}>
              <Image src={sh.src} alt={sh.alt} width={sh.w} height={sh.h} sizes={sizes} />
            </div>
          ))}
        </div>
      </div>
      <figcaption className={s.cap} aria-live="polite">{shots[k].cap}</figcaption>
    </figure>
  );
}
