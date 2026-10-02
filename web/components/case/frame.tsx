import Image from 'next/image';
import type { ReactNode } from 'react';
import type { Figure } from '@/content';
import { FRAME_PAD, frameMode } from '@/lib/figure-rules';
import s from './frame.module.css';

/** 그림 한 장. 폭은 부모 칸이 정하고 원본 픽셀보다 커지지 않는다(§5-4). grow = 한 줄 높이 맞춤의 한 칸(§5-2) */
export function Frame({ fig, sizes, ctx = 'block', grow = false, zoomPins, children }: {
  fig: Figure; sizes: string; ctx?: 'block' | 'phones'; grow?: boolean;
  /** 폰 확대 뷰어 아래 줄의 번호 단추(표지 번호 · 핫스팟 가운데, 원본 대비 %) */
  zoomPins?: { n: string; x: number; y: number; text: string }[]; children?: ReactNode;
}) {
  const w = fig.w, h = fig.h;
  if (!w || !h) throw new Error(`그림 크기가 없습니다(resolveStudy 를 거치지 않음): ${fig.src}`);
  const long = frameMode(w, h, ctx) === 'long';
  return (
    <figure className={s.fig} data-frame data-w={w} data-h={h}
            style={grow ? { flex: `${w / h} 1 0` } : { maxWidth: w + FRAME_PAD * 2 }}>
      <div className={`${s.box} ${long ? s.long : ''}`} data-lenis-prevent-wheel={long ? true : undefined}
           data-zoom={fig.src} data-zoom-alt={fig.alt} data-zoom-pins={zoomPins?.length ? JSON.stringify(zoomPins) : undefined}
           style={long ? undefined : { aspectRatio: `${w + FRAME_PAD * 2} / ${h + FRAME_PAD * 2}` }}>
        <Image src={fig.src} alt={fig.alt} width={w} height={h} sizes={sizes} className={s.img} />
        {children}
        <span className={s.zoomTag} data-zoom-tag aria-hidden="true">⤢ 크게 보기</span>
      </div>
      {fig.caption ? <figcaption className={s.cap}>{fig.caption}</figcaption> : null}
    </figure>
  );
}
