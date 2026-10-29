'use client';
import { useEffect, useRef } from 'react';
import { AMP_H, AMP_TIP } from './amp-path';
import { INTRO_DONE } from './intro';
import s from './home.module.css';

const NS = 'http://www.w3.org/2000/svg';
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const f = (n: number) => n.toFixed(1);
type Anchor = { len: number; y: number };
type Box = { l: number; t: number; r: number; b: number; w: number; h: number };

/** 홈을 잇는 선(시그니처 2) — 첫 & 의 오른쪽 가로획 끝에서 획이 가늘어지며 빠져나와 선이 되고,
 *  일하는 방식의 세 점을 지나(문제 파악: 매듭이 풀리며 닿음 · 설계와 개발: 팽팽하게 곧장 · 오픈 후 수정: 지나쳤다 되돌아와 맞춤),
 *  섹션 경계마다 머리 선 끝을 한 번 짚고, 마지막 & 의 같은 가로획 끝으로 들어가 그 & 를 그린 뒤 채운다.
 *  선 끝은 화면 높이 62% 를 따라간다(스크롤을 붙잡지 않는다). 긴 여백 구간에서는 최근 240px 만 남겨 오른쪽 세로선이 늘어서지 않게 한다.
 *  같은 고리에서 머리글 낱말 채우기(시그니처 3)와 남색 헤더 전환도 돈다. 글 칸은 지나지 않는다 */
export function Thread() {
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = svg.current, root = el?.parentElement;
    if (!el || !root) return;
    const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
    root.dataset.motion = reduced ? 'still' : 'on';

    // 선 길이·높이 짝, 구간 경계(E: 세 점을 지난 뒤), 그리기 상태
    let L = 0, E = 0, top = 0, darkTop = Infinity, aIn = 0, maxT = 0, raf = 0, ready = false, yS = -1, taperLen = 0;
    let anchors: Anchor[] = [], dotsAt: { el: HTMLElement; len: number }[] = [];
    let ink: SVGPathElement | null = null, light: SVGPathElement | null = null, tip: SVGCircleElement | null = null, taper: SVGPathElement | null = null;
    let traceLen = 0, ampBox: Box | null = null;
    const fills = [...root.querySelectorAll<HTMLElement>('[data-fill]')].map((h) => ({ h, ws: [...h.querySelectorAll<HTMLElement>('[data-w]')], n: -1 }));
    const contactAmp = root.querySelector<SVGSVGElement>('[data-amp="contact"]');
    const trace = contactAmp?.querySelector<SVGPathElement>('[data-trace]') ?? null;
    const contactSec = root.querySelector<HTMLElement>('[data-sec="contact"]');

    const rel = (e: Element): Box => { const r = e.getBoundingClientRect(), b = root.getBoundingClientRect(); return { l: r.left - b.left, t: r.top - b.top, r: r.right - b.left, b: r.bottom - b.top, w: r.width, h: r.height }; };
    const lenAt = (y: number) => {
      if (!anchors.length || y <= anchors[0].y) return 0;
      for (let i = 1; i < anchors.length; i++) {
        const [p, q] = [anchors[i - 1], anchors[i]];
        if (y <= q.y) return p.len + (q.len - p.len) * clamp((y - p.y) / Math.max(1, q.y - p.y));
      }
      return L;
    };

    const build = () => {
      const W = root.clientWidth, H = root.offsetHeight, desk = innerWidth >= 1024, vh = innerHeight;
      top = root.getBoundingClientRect().top + scrollY;
      maxT = document.documentElement.scrollHeight - vh - top + vh * 0.62 - 8;   // 맨 끝까지 내렸을 때 선 끝이 닿는 높이
      el.setAttribute('viewBox', `0 0 ${W} ${H}`); el.setAttribute('width', String(W)); el.setAttribute('height', String(H));
      el.replaceChildren();
      const how = root.querySelector<HTMLElement>('#how'), heroAmp = root.querySelector('[data-amp="hero"]');
      if (!how || !heroAmp || !contactAmp || !contactSec) return;
      const padR = parseFloat(getComputedStyle(how).paddingRight);
      let xm = rel(how).r - padR + Math.min(padR * 0.5, 48);   // 오른쪽 여백 가운데(폰은 글 칸 바로 바깥)
      const a = rel(heroAmp), c = rel(contactAmp), sec = rel(contactSec);
      darkTop = sec.t; ampBox = c;

      // 첫 & 가로획 끝: 획 두께에서 선 두께로 가늘어지며 빠져나온다
      const ha = a.h / AMP_H, hx = a.l + AMP_TIP.x * ha, hy = a.t + AMP_TIP.y * ha, th = AMP_TIP.h * ha;
      taperLen = desk ? 28 : 12;
      const tx = hx + taperLen;
      xm = Math.max(xm, tx + 4);
      taper = document.createElementNS(NS, 'path');
      taper.setAttribute('d', `M${f(hx - 1)} ${f(hy - th / 2)} C${f(hx + taperLen * 0.45)} ${f(hy - th / 2)} ${f(hx + taperLen * 0.7)} ${f(hy - 1)} ${f(tx)} ${f(hy - 1)} L${f(tx)} ${f(hy + 1)} C${f(hx + taperLen * 0.7)} ${f(hy + 1)} ${f(hx + taperLen * 0.45)} ${f(hy + th / 2)} ${f(hx - 1)} ${f(hy + th / 2)} Z`);
      taper.setAttribute('class', s.threadTaper);

      const m = document.createElementNS(NS, 'path');
      el.appendChild(m);
      let d = `M${f(tx)} ${f(hy)}`, len = 0, lastY = -Infinity;
      anchors = [{ len: 0, y: hy - vh * 0.35 }]; dotsAt = []; lastY = anchors[0].y;
      /** 조각을 잇고, 그 조각이 끝나는 길이를 스크롤 높이 y 에 맞춘다(높이는 늘 늘어나게) */
      const seg = (part: string, y: number) => { d += part; m.setAttribute('d', d); len = m.getTotalLength(); lastY = Math.max(lastY + 1, y); anchors.push({ len, y: lastY }); };

      // 출구: 가로로 조금 더 뻗다가 여백으로 꺾여 내려간다
      if (xm - 40 > tx) seg(` L${f(xm - 40)} ${f(hy)} Q${f(xm)} ${f(hy)} ${f(xm)} ${f(hy + 40)}`, hy + 40);
      else seg(` C${f(xm)} ${f(hy)} ${f(xm)} ${f(hy)} ${f(xm)} ${f(hy + Math.max(24, (xm - tx) * 1.8))}`, hy + 40);   // 남은 폭이 좁아도 꺾임이 둥글게

      const dots = [...root.querySelectorAll<HTMLElement>('[data-step-dot]')];
      if (desk && dots.length === 3) {
        const p = dots.map((dt) => { const r = rel(dt); return { el: dt.closest<HTMLElement>('[data-step]')!, x: r.l + r.w / 2, y: r.t + r.h / 2 }; });
        const [p1, p2, p3] = p;
        // 문제 파악 — 첫 점 줄 높이로 꺾어 들어오다, 작은 매듭 하나가 풀리며 첫 점에 닿는다(매듭 구간은 천천히)
        const kx = p3.x + 70;
        seg(` L${f(xm)} ${f(p1.y - 90)}`, p1.y - 200);
        seg(` Q${f(xm)} ${f(p1.y)} ${f(xm - 50)} ${f(p1.y)} L${f(kx + 46)} ${f(p1.y)}`, p1.y - 150);
        seg(` C${f(kx + 14)} ${f(p1.y)} ${f(kx - 4)} ${f(p1.y - 36)} ${f(kx + 18)} ${f(p1.y - 40)} C${f(kx + 42)} ${f(p1.y - 44)} ${f(kx + 34)} ${f(p1.y - 4)} ${f(kx)} ${f(p1.y)}`, p1.y - 70);
        seg(` L${f(p1.x)} ${f(p1.y)}`, p1.y);
        dotsAt.push({ el: p1.el, len });
        seg('', p1.y + 60);                                       // 첫 점에서 잠깐 멈춤
        // 설계와 개발 — 팽팽한 곡선으로 곧장 다음 점까지(짧은 스크롤에 긴 길이: 빠르게)
        seg(` C${f(p1.x + (p2.x - p1.x) * 0.62)} ${f(p1.y)} ${f(p2.x - (p2.x - p1.x) * 0.18)} ${f(p2.y)} ${f(p2.x)} ${f(p2.y)}`, p2.y + 40);
        dotsAt.push({ el: p2.el, len });
        seg('', p2.y + 80);
        // 오픈 후 수정 — 셋째 점을 조금 지나쳤다가 짧게 되돌아와 맞춘다
        seg(` C${f(p2.x + (p3.x - p2.x) * 0.5)} ${f(p2.y)} ${f(p3.x - 40)} ${f(p3.y)} ${f(p3.x + 28)} ${f(p3.y + 6)}`, p3.y + 120);
        seg(` C${f(p3.x + 46)} ${f(p3.y + 10)} ${f(p3.x + 16)} ${f(p3.y + 18)} ${f(p3.x)} ${f(p3.y)}`, p3.y + 190);
        dotsAt.push({ el: p3.el, len });
        seg('', p3.y + 250);
        seg(` L${f(xm - 50)} ${f(p3.y)} Q${f(xm)} ${f(p3.y)} ${f(xm)} ${f(p3.y + 50)}`, p3.y + 330);
      }
      E = len;

      // 섹션이 바뀌는 곳마다 머리 선의 오른쪽 끝을 한 번 짚는다
      for (const sel of ['#can', '#work', '[data-sec="contact"]']) {
        const rule = root.querySelector(`${sel} .${s.sh}`);
        if (!rule) continue;
        const r = rel(rule), ry = r.t, cr = r.r;
        if (ry - 60 <= (anchors.at(-1)?.y ?? 0)) continue;
        seg(` L${f(xm)} ${f(ry - 60)}`, ry - 60);
        seg(` C${f(xm)} ${f(ry - 20)} ${f(cr + 12)} ${f(ry)} ${f(cr)} ${f(ry)}`, ry);
        seg(` C${f(cr + 12)} ${f(ry)} ${f(xm)} ${f(ry + 20)} ${f(xm)} ${f(ry + 60)}`, ry + 60);
      }

      // 입구: 마지막 & 의 같은 가로획 끝으로, 오른쪽에서 가로로 들어간다. 그다음 스크롤은 & 를 그리는 데 쓴다
      const hc = c.h / AMP_H, ex = c.l + AMP_TIP.x * hc, ey = c.t + AMP_TIP.y * hc;
      const traceRun = Math.min(360, vh * 0.4);
      // 끝까지 내렸을 때 다 그려지도록 들어가는 높이를 맨 끝에서 traceRun 만큼 앞에 둔다(공간이 모자라면 40px 까지 줄인다)
      const want = Math.min(Math.max(lastY + 80, Math.min(ey, maxT - traceRun)), maxT - 40);
      seg(` L${f(xm)} ${f(ey - 60)}`, want - 60);
      seg(` Q${f(xm)} ${f(ey)} ${f(Math.max(ex, xm - 40))} ${f(ey)} L${f(ex)} ${f(ey)}`, want);
      aIn = lastY;
      m.remove();
      L = len;
      // 꼬리 줄이기는 일하는 방식이 끝난 뒤부터(폰은 세 점 구간이 없어도 첫 화면 쪽 선은 남는다)
      E = Math.max(E, lenAt(rel(how).b));
      if (!desk) dotsAt = dots.map((dt) => ({ el: dt.closest<HTMLElement>('[data-step]')!, len: lenAt(rel(dt).t + rel(dt).h / 2) }));
      // & 를 그리는 획: 선과 같은 화면 굵기(2px)가 되게 & 크기로 나눠 넣고, 점선 길이는 실제 획 길이로
      traceLen = trace?.getTotalLength() ?? 0;
      if (trace) { trace.style.strokeWidth = f(2 / (c.h / AMP_H)); trace.style.strokeDasharray = `${f(traceLen)} ${f(traceLen + 10)}`; }

      el.insertAdjacentHTML('afterbegin', `<defs><clipPath id="thread-dark"><rect x="0" y="${f(sec.t)}" width="${W}" height="${f(H - sec.t)}"/></clipPath></defs>`);
      el.appendChild(taper);
      const mk = (cls: string, clip?: boolean) => {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', d); p.setAttribute('class', cls);
        if (clip) p.setAttribute('clip-path', 'url(#thread-dark)');
        el.appendChild(p); return p;
      };
      ink = mk(s.threadInk); light = mk(`${s.threadInk} ${s.threadLight}`, true);
      tip = document.createElementNS(NS, 'circle'); tip.setAttribute('r', '4.5'); tip.setAttribute('class', s.threadTip); el.appendChild(tip);
      yS = -1;
      paint(reduced ? Infinity : scrollY - top + vh * 0.62);
    };

    /** y: 선 끝이 따라갈 높이(부드럽게 따라간 값) */
    const paint = (y: number) => {
      if (!ink || !light || !tip || !taper) return;
      const drawn = reduced ? L : lenAt(y);
      // 세 점을 지난 뒤로는 꼬리를 줄여 최근 240px 만 남긴다
      const start = reduced || drawn <= E ? 0 : clamp(Math.min(drawn - 240, (drawn - E) * 1.8), 0, drawn);
      for (const p of [ink, light]) { p.style.strokeDasharray = `${f(Math.max(0, drawn - start))} ${f(L + 40)}`; p.style.strokeDashoffset = f(-start); }
      taper.toggleAttribute('data-on', drawn > 1 && start < 1);
      // & 그리기: 가로획 끝에 닿은 뒤 남은 스크롤이 획을 그리고, 다 그리면 채운다
      const k = reduced ? 1 : clamp((y - aIn) / Math.max(1, maxT - aIn));
      if (trace) trace.style.strokeDashoffset = f(traceLen * (1 - k));
      contactAmp?.toggleAttribute('data-drawn', k >= 0.995);
      contactAmp?.toggleAttribute('data-tracing', k > 0 && k < 0.995);
      let pt: { x: number; y: number };
      if (k > 0 && trace && ampBox) { const q = trace.getPointAtLength(k * traceLen), sc = ampBox.h / AMP_H; pt = { x: ampBox.l + q.x * sc, y: ampBox.t + q.y * sc }; }
      else pt = ink.getPointAtLength(drawn);
      tip.setAttribute('cx', f(pt.x)); tip.setAttribute('cy', f(pt.y));
      tip.toggleAttribute('data-on', !reduced && drawn > 2 && k < 0.995);
      tip.toggleAttribute('data-dark', pt.y > darkTop);
      for (const dt of dotsAt) dt.el.toggleAttribute('data-on', drawn >= dt.len - 1);
    };
    const words = () => {
      const vh = innerHeight;
      for (const x of fills) {
        const r = x.h.getBoundingClientRect();
        const k = reduced ? 1 : clamp((vh * 0.92 - r.top) / (vh * 0.42));
        const n = Math.floor(k * x.ws.length + 0.0001);
        if (n === x.n) continue;
        x.n = n;
        x.ws.forEach((w, i) => w.toggleAttribute('data-on', i < n));
      }
    };
    /** 헤더가 남색 문의 장 위에 오면 헤더도 남색으로(html[data-hdr-dark]) */
    const header = () => {
      if (!contactSec) return;
      const h = document.querySelector('header')?.getBoundingClientRect().height ?? 64;
      document.documentElement.toggleAttribute('data-hdr-dark', contactSec.getBoundingClientRect().top <= h * 0.5);
    };
    const tick = () => {
      raf = 0;
      header();
      if (!ready) return;
      words();
      const target = scrollY - top + innerHeight * 0.62;
      // 크게 건너뛰었으면(링크·새로고침 복원·빠른 끌기) 따라가는 장면 없이 바로 그 자리 상태로
      if (yS < 0 || reduced || Math.abs(target - yS) > innerHeight * 1.5) yS = target;
      else yS += (target - yS) * 0.18;
      paint(yS);
      if (Math.abs(target - yS) > 0.5) raf = requestAnimationFrame(tick);
    };
    const wake = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const begin = () => { ready = true; build(); wake(); };

    let rz = 0;
    const onResize = () => { clearTimeout(rz); rz = window.setTimeout(() => { if (ready) build(); wake(); }, 150); };
    const ro = new ResizeObserver(onResize);
    ro.observe(root);
    addEventListener('scroll', wake, { passive: true });
    document.fonts?.ready.then(onResize);
    if (document.documentElement.dataset.intro === 'on') addEventListener(INTRO_DONE, begin, { once: true });
    else begin();
    return () => {
      cancelAnimationFrame(raf); clearTimeout(rz); ro.disconnect();
      removeEventListener('scroll', wake); removeEventListener(INTRO_DONE, begin);
      delete root.dataset.motion;
      document.documentElement.removeAttribute('data-hdr-dark');
    };
  }, []);

  return <svg ref={svg} className={s.thread} aria-hidden="true" data-thread />;
}
