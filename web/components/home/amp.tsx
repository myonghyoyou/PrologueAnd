import { AMP_D, AMP_W, AMP_H } from './amp-path';

/** 브랜드 & — 글꼴 대신 미리 뽑은 윤곽(SVG). 인트로의 엉킨 선이 정확히 이 모양으로 모이고, 끝 장면에서 선이 이 윤곽을 그린다 */
export function Amp({ className, which }: { className?: string; which: 'hero' | 'contact' }) {
  return (
    <svg className={className} data-amp={which} viewBox={`0 0 ${AMP_W} ${AMP_H}`} aria-hidden="true" focusable="false">
      <path d={AMP_D} fillRule="evenodd" pathLength={1} />
    </svg>
  );
}
