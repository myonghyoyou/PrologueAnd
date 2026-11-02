'use client';
import { useEffect, useRef, useState } from 'react';
import { getLenis } from '@/components/lenis-provider';
import { AMP_W, AMP_H, AMP_CONTOURS } from './amp-path';
import s from './home.module.css';

/** 인트로를 볼지 — 페이지 맨 위 인라인 스크립트(INTRO_GATE)가 html[data-intro="on"] 으로 정해 두고, 여기서는 그 값만 읽는다 */
export const INTRO_KEY = 'prologue.intro';
export const INTRO_DONE = 'prologue:intro-done';
const AGAIN_AFTER = 30 * 24 * 3600 * 1000;   // 한 번 본 브라우저는 30일 동안 다시 보이지 않는다
/** 첫 그림 전에 실행 — 30일 안에 본 적 없음·맨 위·모션 허용일 때만 히어로를 숨기고 인트로를 켠다.
 *  자동화 브라우저(테스트)는 ?intro 가 있을 때만. 2.5초 안에 인트로가 시작되지 않으면(스크립트 실패) 그냥 보인다 */
export const INTRO_GATE = `(function(){try{var q=location.search.indexOf('intro')>-1;
var t=+localStorage.getItem('${INTRO_KEY}')||0;if(Date.now()-t<${AGAIN_AFTER}&&!q)return;
if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
if((navigator.webdriver&&!q)||location.hash||scrollY>0)return;
var h=document.documentElement;h.dataset.intro='on';
setTimeout(function(){if(h.dataset.intro==='on'&&!window.__introStarted)h.dataset.intro='skip'},2500)}catch(e){}})();`;

/** 그리기 → 잠깐 머묾 → & 로 모임 → 채움. 합쳐 약 2.7초, 그 뒤 제목이 0.7초에 올라온다 */
const DRAW = 800, HOLD = 250, MORPH = 1400, FILL = 280;
const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
type P = [number, number];

/** 화면을 채우는 엉킨 선 — 무작위 점 60개를 2차 곡선으로 이어 점열로 편다(전보다 절반: 겹침을 줄였다) */
function tangle(w: number, h: number): P[] {
  let seed = 7;
  const r = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const k: P[] = Array.from({ length: 60 }, () => [w * (0.06 + 0.88 * r()), h * (0.1 + 0.8 * r())]);
  const out: P[] = [k[0]];
  for (let i = 1; i < k.length - 1; i++) {
    const a = out[out.length - 1], c = k[i], b: P = [(k[i][0] + k[i + 1][0]) / 2, (k[i][1] + k[i + 1][1]) / 2];
    for (let j = 1; j <= 20; j++) { const t = j / 20, u = 1 - t; out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); }
  }
  return out;
}

/** & 가닥(열린 점열)을 m 개 점으로 다시 뽑는다 */
function resample(c: P[], m: number): P[] {
  return Array.from({ length: m }, (_, j) => {
    const f = (j * (c.length - 1)) / Math.max(1, m - 1), i = Math.min(c.length - 2, Math.floor(f)), t = f - i, a = c[i], b = c[i + 1];
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] as P;
  });
}

/** 첫 화면 인트로(시그니처 1) — 엉킨 선이 그려지고 곧바로 & 의 여섯 가닥으로 모인 뒤, 제목이 줄마다 올라온다.
 *  스크롤·키·누르기·「건너뛰기」 중 무엇이든 들어오면 그 자리에서 끝나고 첫 화면이 완성된 채로 나온다(data-intro="skip").
 *  캔버스 2D 한 장, 점 약 1,200개의 위치 보간만 한다(저사양 기준) */
export function Intro() {
  const [on, setOn] = useState(false);
  const cv = useRef<HTMLCanvasElement>(null);
  const skip = useRef<() => void>(() => {});

  useEffect(() => {
    if (document.documentElement.dataset.intro !== 'on') return;
    (window as unknown as { __introStarted?: boolean }).__introStarted = true;
    setOn(true);
  }, []);

  useEffect(() => {
    if (!on || !cv.current) return;
    const html = document.documentElement, canvas = cv.current, ctx = canvas.getContext('2d')!;
    const W = innerWidth, H = innerHeight, dpr = Math.min(1.5, devicePixelRatio || 1);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // 선 굵기는 & 가닥과 같은 화면 굵기(--amp-line) — 인트로가 끝나 SVG 로 바뀌어도 굵기가 그대로다
    ctx.lineWidth = parseFloat(getComputedStyle(document.querySelector('[data-home]') ?? html).getPropertyValue('--amp-line')) || 1.6;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const ink = getComputedStyle(canvas).color;
    const pts = tangle(W, H);
    getLenis()?.stop();
    const prevOverflow = html.style.overflow; html.style.overflow = 'hidden';

    let raf = 0, t0 = performance.now(), phase: 'draw' | 'morph' | 'fill' | 'end' = 'draw';
    let groups: { src: P[]; dst: P[]; full: P[] }[] = [], amp: DOMRect | null = null;

    const stroke = (p: P[], n = p.length) => {
      ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]);
      for (let i = 1; i < n; i++) ctx.lineTo(p[i][0], p[i][1]);
      ctx.stroke();
    };
    /** 엉킨 선을 & 가닥(보이는 구간) 길이 비율로 나눠, 조각마다 가닥 하나에 1:1 로 짝짓는다 */
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
        return { src, dst: resample(c, src.length), full: c };
      });
    };
    /** cut: 입력으로 끊었으면 제목도 기다리지 않고 바로 보인다 */
    const finish = (cut: boolean) => {
      if (phase === 'end') return;
      phase = 'end';
      cancelAnimationFrame(raf);
      try { localStorage.setItem(INTRO_KEY, String(Date.now())); } catch {}
      html.dataset.intro = cut ? 'skip' : 'done';
      html.style.overflow = prevOverflow;
      getLenis()?.start();
      window.dispatchEvent(new Event(INTRO_DONE));
      setTimeout(() => setOn(false), 40);
    };
    skip.current = () => finish(true);

    const frame = (now: number) => {
      const t = now - t0;
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = ink; ctx.fillStyle = ink;
      if (phase === 'draw') {
        const k = Math.min(1, t / DRAW);
        stroke(pts, Math.max(2, Math.floor(pts.length * (1 - Math.pow(1 - k, 3)))));
        if (t >= DRAW + HOLD) { plan(); phase = 'morph'; t0 = now; }
      } else if (phase === 'morph') {
        const e = ease(Math.min(1, t / MORPH));
        for (const g of groups) stroke(g.src.map((a, i) => [a[0] + (g.dst[i][0] - a[0]) * e, a[1] + (g.dst[i][1] - a[1]) * e] as P), g.src.length);
        if (t >= MORPH) { phase = 'fill'; t0 = now; }
      } else if (phase === 'fill' && amp) {
        // 모인 뒤 잠깐 머문다 — 가닥 원래 점(촘촘한 곡선)으로 그려 SVG 와 같은 모양에서 끝난다
        for (const g of groups) stroke(g.full);
        if (t >= FILL) return finish(false);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // 무엇이든 입력이 오면 바로 끝낸다. 그 입력이 페이지를 움직이지는 않게 막는다
    const cut = (e: Event) => { e.preventDefault(); finish(true); };
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest?.('button')) return;   // 건너뛰기 단추의 Enter·Space 는 단추가 처리
      if (['ArrowDown', 'PageDown', ' ', 'Enter', 'End', 'Escape'].includes(e.key)) { e.preventDefault(); finish(true); }
    };
    addEventListener('wheel', cut, { passive: false });
    addEventListener('touchmove', cut, { passive: false });
    addEventListener('keydown', key);
    canvas.addEventListener('pointerdown', cut);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('wheel', cut); removeEventListener('touchmove', cut); removeEventListener('keydown', key);
      canvas.removeEventListener('pointerdown', cut);
      if (phase !== 'end') { html.style.overflow = prevOverflow; getLenis()?.start(); }
    };
  }, [on]);

  if (!on) return null;
  return (
    <div className={s.introLayer} data-intro-layer>
      <canvas ref={cv} className={s.introCv} aria-hidden="true" />
      <button type="button" className={s.introSkip} onClick={() => skip.current()}>건너뛰기</button>
    </div>
  );
}
