import { AMP_D, AMP_W, AMP_H, AMP_TRACE } from './amp-path';

/** 브랜드 & — 글꼴 대신 미리 뽑은 윤곽(SVG). 인트로의 엉킨 선이 정확히 이 모양으로 모인다.
 *  문의 장의 & 는 그리는 획(data-trace)을 하나 더 갖는다 — 내려온 선이 가로획 끝으로 들어와 이 획을 그리고, 다 그리면 채운다 */
export function Amp({ className, which }: { className?: string; which: 'hero' | 'contact' }) {
  return (
    <svg className={className} data-amp={which} viewBox={`0 0 ${AMP_W} ${AMP_H}`} aria-hidden="true" focusable="false">
      <path d={AMP_D} fillRule="evenodd" data-fillpath />
      {which === 'contact' ? <path d={AMP_TRACE} data-trace /> : null}
    </svg>
  );
}
