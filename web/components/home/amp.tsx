import { AMP_VB, AMP_LINES, AMP_MASKS, type AmpLine } from './amp-path';

/** 큰 & — 기준 SVG(public/brand/ampersand_dense_thicker.svg)의 여섯 가닥을 그대로 그린다(경로·가리개 원본 그대로).
 *  화면마다 바뀌는 것은 CSS 의 선 굵기·색·크기뿐(home.module.css --amp-line, .heroAmp/.contactAmp).
 *  문의 장의 & 는 잇는 선 고리가 가닥마다 그리는 정도(dashoffset)를 넣는다 — 스크립트가 없으면 처음부터 다 보인다 */
export function Amp({ className, which }: { className?: string; which: 'hero' | 'contact' }) {
  const id = (k: string) => `amp-${which}-${k}`;
  const lines = (g: AmpLine['group']) => AMP_LINES.filter((l) => l.group === g).map((l) => <path key={l.id} d={l.d} data-line={l.id} data-group={g} />);
  return (
    <svg className={className} data-amp={which} viewBox={AMP_VB.join(' ')} aria-hidden="true" focusable="false">
      <defs>
        <mask id={id('loops')} maskUnits="userSpaceOnUse" x="0" y="0" width="1254" height="1254">
          <rect width="1254" height="1254" fill="white" />
          <path d={AMP_MASKS.loops.d} fill="none" stroke="black" strokeWidth={AMP_MASKS.loops.w} strokeLinecap="round" />
        </mask>
        <mask id={id('desc')} maskUnits="userSpaceOnUse" x="0" y="0" width="1254" height="1254">
          <rect width="1254" height="1254" fill="white" />
          <rect width="1254" height={AMP_MASKS.desc.top} fill="black" />
          <path d={AMP_MASKS.desc.d} fill="none" stroke="black" strokeWidth={AMP_MASKS.desc.w} strokeLinecap="round" />
        </mask>
      </defs>
      <g mask={`url(#${id('loops')})`}>{lines('loops')}</g>
      <g mask={`url(#${id('desc')})`}>{lines('desc')}</g>
      <g>{lines('bar')}</g>
      <g>{lines('diag')}</g>
    </svg>
  );
}
