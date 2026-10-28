'use client';
import { useLayoutEffect, useRef, useState } from 'react';

/** 일하는 방식의 계단 선 — 같은 부모 안의 [data-step-dot] 가운데를 차례로 잇는다(정적).
 *  P2 에서 이 path 에 그려지는 움직임을 붙인다. 계단이 풀리는 폭(1023 이하)에서는 CSS 가 숨긴다 */
export function StepLine({ className }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const [geo, setGeo] = useState<{ d: string; w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const box = svg.current?.parentElement;
    if (!box) return;
    const measure = () => {
      const r = box.getBoundingClientRect();
      const pts = [...box.querySelectorAll<HTMLElement>('[data-step-dot]')].map((el) => {
        const b = el.getBoundingClientRect();
        return [b.left - r.left + b.width / 2, b.top - r.top + b.height / 2];
      });
      if (pts.length < 2) return;
      let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], mx = (x0 + x1) / 2;
        d += ` C${mx.toFixed(1)} ${y0.toFixed(1)} ${mx.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
      }
      setGeo({ d, w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, []);

  return (
    <svg ref={svg} className={className} aria-hidden="true" data-step-line viewBox={geo ? `0 0 ${geo.w} ${geo.h}` : undefined}>
      {geo ? <path d={geo.d} /> : null}
    </svg>
  );
}
