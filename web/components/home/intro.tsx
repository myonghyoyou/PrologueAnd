'use client';
import { useEffect, useRef, useState } from 'react';
import { getLenis } from '@/components/lenis-provider';
import { AMP_D, AMP_W, AMP_H, AMP_CONTOURS } from './amp-path';
import s from './home.module.css';

/** 인트로를 볼지 — 페이지 맨 위 인라인 스크립트(INTRO_GATE)가 html[data-intro="on"] 으로 정해 두고, 여기서는 그 값만 읽는다 */
export const INTRO_KEY = 'prologue.intro';
export const INTRO_DONE = 'prologue:intro-done';
/** 첫 그림 전에 실행 — 처음 들어온 세션·맨 위·모션 허용일 때만 히어로를 숨기고 인트로를 켠다.
 *  자동화 브라우저(테스트)는 ?intro 가 있을 때만. 2.5초 안에 인트로가 시작되지 않으면(스크립트 실패) 그냥 보인다 */
export const INTRO_GATE = `(function(){try{var q=location.search.indexOf('intro')>-1;
if(sessionStorage.getItem('${INTRO_KEY}')&&!q)return;
if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
if((navigator.webdriver&&!q)||location.hash||scrollY>0)return;
var h=document.documentElement;h.dataset.intro='on';
setTimeout(function(){if(h.dataset.intro==='on'&&!window.__introStarted)h.dataset.intro='done'},2500)}catch(e){}})();`;

const DRAW = 1400, MORPH = 2200, FILL = 380;
const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
type P = [number, number];

/** 화면을 가득 채우는 엉킨 선 — 무작위 점 120개를 2차 곡선으로 이어 점열로 편다 */
function tangle(w: number, h: number): P[] {
  let seed = 7;
  const r = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const k: P[] = Array.from({ length: 120 }, () => [w * (0.04 + 0.92 * r()), h * (0.06 + 0.88 * r())]);
  const out: P[] = [k[0]];
  for (let i = 1; i < k.length - 1; i++) {
    const a = out[out.length - 1], c = k[i], b: P = [(k[i][0] + k[i + 1][0]) / 2, (k[i][1] + k[i + 1][1]) / 2];
    for (let j = 1; j <= 14; j++) { const t = j / 14, u = 1 - t; out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); }
  }
  return out;
}

/** & 윤곽(닫힌 점열)을 m 개 점으로 다시 뽑는다 */
function resample(c: P[], m: number): P[] {
  return Array.from({ length: m }, (_, j) => {
    const f = (j * c.length) / m, i = Math.floor(f), t = f - i, a = c[i], b = c[(i + 1) % c.length];
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] as P;
  });
}

/** 첫 화면 인트로(시그니처 1) — 엉킨 선이 그려지고, 첫 스크롤·키·터치에 &로 모인 뒤 채워진다. 그다음 제목이 줄마다 올라온다.
 *  캔버스 2D 한 장, 점 약 1,700개의 위치 보간만 한다(저사양 기준). 「건너뛰기」로 언제든 끝낸다 */
export function Intro() {
  const [on, setOn] = useState(false);
  const cv = useRef<HTMLCanvasElement>(null);
  const skip = useRef<() => void>(() => {});

  useEffect(() => {
    const html = document.documentElement;
    if (html.dataset.intro !== 'on') return;
    (window as unknown as { __introStarted?: boolean }).__introStarted = true;
    setOn(true);
  }, []);

  useEffect(() => {
    if (!on || !cv.current) return;
    const html = document.documentElement, canvas = cv.current, ctx = canvas.getContext('2d')!;
    const W = innerWidth, H = innerHeight, dpr = Math.min(1.5, devicePixelRatio || 1);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const ink = getComputedStyle(canvas).color;
    const pts = tangle(W, H);
    const lenis = getLenis(); lenis?.stop();
    const prevOverflow = html.style.overflow; html.style.overflow = 'hidden';

    let raf = 0, t0 = performance.now(), phase: 'draw' | 'wait' | 'morph' | 'fill' | 'end' = 'draw', queued = false;
    let groups: { src: P[]; dst: P[] }[] = [], amp: DOMRect | null = null;

    const stroke = (p: P[], n = p.length, close = false) => {
      ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]);
      for (let i = 1; i < n; i++) ctx.lineTo(p[i][0], p[i][1]);
      if (close) ctx.closePath();
      ctx.stroke();
    };
    /** 엉킨 선을 & 윤곽 길이 비율로 나눠, 조각마다 윤곽 하나에 1:1 로 짝짓는다 */
    const plan = () => {
      const el = document.querySelector<SVGSVGElement>('[data-amp="hero"]');
      amp = el?.getBoundingClientRect() ?? new DOMRect(W * 0.6, H * 0.2, H * 0.4, H * 0.4);
      const sx = amp.width / AMP_W, sy = amp.height / AMP_H;
      const cs = AMP_CONTOURS.map((c) => c.split(' ').map((q) => { const [x, y] = q.split(',').map(Number); return [amp!.left + x * sx, amp!.top + y * sy] as P; }));
      const total = cs.reduce((a, c) => a + c.length, 0);
      let at = 0;
      groups = cs.map((c, g) => {
        const m = g === cs.length - 1 ? pts.length - at : Math.round((pts.length * c.length) / total);
        const src = pts.slice(at, at + m); at += m;
        return { src, dst: resample(c, src.length) };
      });
    };
    const finish = () => {
      if (phase === 'end') return;
      phase = 'end';
      cancelAnimationFrame(raf);
      try { sessionStorage.setItem(INTRO_KEY, '1'); } catch {}
      html.dataset.intro = 'done';
      html.style.overflow = prevOverflow;
      getLenis()?.start();
      window.dispatchEvent(new Event(INTRO_DONE));
      setTimeout(() => setOn(false), 60);
    };
    skip.current = finish;
    const start = () => {
      if (phase === 'draw') { queued = true; return; }
      if (phase !== 'wait') return;
      plan(); phase = 'morph'; t0 = performance.now();
    };

    const frame = (now: number) => {
      const t = now - t0;
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = ink; ctx.fillStyle = ink;
      if (phase === 'draw') {
        const k = Math.min(1, t / DRAW);
        stroke(pts, Math.max(2, Math.floor(pts.length * (1 - Math.pow(1 - k, 3)))));
        if (k >= 1) { phase = 'wait'; if (queued) start(); }
      } else if (phase === 'wait') {
        stroke(pts);
      } else if (phase === 'morph') {
        const e = ease(Math.min(1, t / MORPH));
        for (const g of groups) stroke(g.src.map((a, i) => [a[0] + (g.dst[i][0] - a[0]) * e, a[1] + (g.dst[i][1] - a[1]) * e] as P), g.src.length, e > 0.98);
        if (t >= MORPH) { phase = 'fill'; t0 = now; }
      } else if (phase === 'fill' && amp) {
        for (const g of groups) stroke(g.dst, g.dst.length, true);
        const k = Math.min(1, t / FILL);
        ctx.save(); ctx.globalAlpha = k;
        ctx.translate(amp.left, amp.top); ctx.scale(amp.width / AMP_W, amp.height / AMP_H);
        ctx.fill(new Path2D(AMP_D), 'evenodd');
        ctx.restore();
        if (k >= 1) return finish();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // 첫 입력이 풀기 신호다. 인트로 동안은 페이지가 움직이지 않게 막는다
    const block = (e: Event) => { e.preventDefault(); start(); };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return finish();
      if (['ArrowDown', 'PageDown', ' ', 'Enter', 'End'].includes(e.key) && !(e.target as HTMLElement).closest('button')) { e.preventDefault(); start(); }
    };
    addEventListener('wheel', block, { passive: false });
    addEventListener('touchmove', block, { passive: false });
    addEventListener('keydown', key);
    canvas.addEventListener('pointerdown', start);
    return () => {
      canvas.removeEventListener('pointerdown', start);
      cancelAnimationFrame(raf);
      removeEventListener('wheel', block); removeEventListener('touchmove', block); removeEventListener('keydown', key);
      if (phase !== 'end') { html.style.overflow = prevOverflow; getLenis()?.start(); }
    };
  }, [on]);

  if (!on) return null;
  return (
    <div className={s.introLayer} data-intro-layer>
      <canvas ref={cv} className={s.introCv} aria-hidden="true" />
      <p className={s.introHint} aria-hidden="true">아래로 내려 보세요</p>
      <button type="button" className={s.introSkip} onClick={() => skip.current()}>건너뛰기</button>
    </div>
  );
}
