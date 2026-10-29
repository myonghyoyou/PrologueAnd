import { AMP_D, AMP_W, AMP_H, AMP_LINE, AMP_PARTS, AMP_WMAX } from './amp-path';

/** 큰 & — 한 획으로 그린 전용 형태(amp-path). 인트로의 엉킨 선이 이 획의 중심선으로 모인다.
 *  문의 장의 & 는 같은 획을 넷으로 나눠, 조각마다 가림막(data-trace: 중심선을 굵게 그은 것)을 둔다 —
 *  내려온 선이 팔 끝으로 들어와 조각을 차례로 드러낸다. 획이 겹치는 자리의 두 가닥은 서로 다른 조각이라 미리 보이지 않는다.
 *  data-line 은 보이지 않는 전체 중심선(선 끝 점의 자리). 스크립트가 없으면 가림막이 다 열려 있다 */
export function Amp({ className, which }: { className?: string; which: 'hero' | 'contact' }) {
  return (
    <svg className={className} data-amp={which} viewBox={`0 0 ${AMP_W} ${AMP_H}`} aria-hidden="true" focusable="false">
      {which === 'contact' ? (
        <>
          <defs>
            {AMP_PARTS.map((p, i) => (
              <mask key={i} id={`amp-draw-${i}`} maskUnits="userSpaceOnUse" x="-20" y="-20" width={AMP_W + 40} height={AMP_H + 40}>
                <path d={p.line} data-trace data-from={p.from} data-to={p.to} fill="none" stroke="#fff" strokeWidth={AMP_WMAX + 8} strokeLinecap="round" strokeLinejoin="round" />
              </mask>
            ))}
          </defs>
          {AMP_PARTS.map((p, i) => <path key={i} d={p.d} data-fillpath mask={`url(#amp-draw-${i})`} />)}
          <path d={AMP_LINE} data-line fill="none" stroke="none" />
        </>
      ) : <path d={AMP_D} data-fillpath />}
    </svg>
  );
}
