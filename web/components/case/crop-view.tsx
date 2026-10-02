import Image from 'next/image';
import type { Crop } from '@/content';
import { FRAME_PAD } from '@/lib/figure-rules';
import s from './crop-view.module.css';

/** 원본 대비 % 영역만 보이는 캡처 한 장. 틀 비율 = 자른 영역(원본 px) + 틀 여백, 폭은 자른 영역 원본 px 를 넘지 않는다 */
export function CropView({ c }: { c: Crop }) {
  const { x, y, w, h } = c.crop;
  const cw = (w / 100) * c.w!, ch = (h / 100) * c.h!;
  return (
    <figure className={s.fig} data-crop={`${x},${y},${w},${h}`} style={{ maxWidth: cw + FRAME_PAD * 2 }}>
      <div className={s.box} data-zoom={c.src} data-zoom-alt={c.alt} data-zoom-crop={`${x},${y},${w},${h}`}>
        {/* 비율은 창에 건다 — 틀에 걸면 여백 14px 때문에 줄어들 때 창 비율이 어긋나 엉뚱한 곳이 보인다 */}
        <div className={s.win} data-crop-win style={{ aspectRatio: `${cw} / ${ch}` }}>
          <Image src={c.src} alt={c.alt} width={c.w!} height={c.h!} sizes={`${c.w}px`} className={s.img}
                 style={{ width: `${(10000 / w).toFixed(3)}%`, left: `${(-x / w * 100).toFixed(3)}%`, top: `${(-y / h * 100).toFixed(3)}%` }} />
        </div>
        <span className={s.zoomTag} data-zoom-tag aria-hidden="true">⤢ 크게 보기</span>
      </div>
    </figure>
  );
}
