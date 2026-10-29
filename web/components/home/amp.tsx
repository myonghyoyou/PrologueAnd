import { AMP_D, AMP_W, AMP_H, AMP_SPINE } from './amp-path';

/** 큰 & — Bodoni Moda 800 윤곽에 받침 꼬리를 다시 그린 것(amp-path). 인트로의 엉킨 선이 이 윤곽으로 모인다.
 *  문의 장의 & 는 뼈대 획(data-trace)을 하나 더 갖는다 — 내려온 선이 받침 꼬리 끝으로 들어와 뼈대를 먼저 그리고, 그다음 굵기가 채워진다.
 *  스크립트가 없으면 뼈대는 숨고 채운 & 만 보인다 */
export function Amp({ className, which }: { className?: string; which: 'hero' | 'contact' }) {
  return (
    <svg className={className} data-amp={which} viewBox={`0 0 ${AMP_W} ${AMP_H}`} aria-hidden="true" focusable="false">
      <path d={AMP_D} data-fillpath />
      {which === 'contact' ? <path d={AMP_SPINE} data-trace /> : null}
    </svg>
  );
}
