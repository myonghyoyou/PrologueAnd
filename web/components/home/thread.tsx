'use client';
import { useEffect, useRef } from 'react';
import { INTRO_DONE } from './intro';
import s from './home.module.css';

const NS = 'http://www.w3.org/2000/svg';
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const f = (n: number) => n.toFixed(1);
type Anchor = { len: number; y: number };

/** 홈을 잇는 선(시그니처 2) — 첫 화면의 & 에서 나와 오른쪽 여백을 타고 내려가며,
 *  데스크톱에서는 일하는 방식의 세 점을 차례로 지나고, 끝에서 문의 장의 & 에 닿으면 그 & 가 그려진다.
 *  선 끝은 화면 높이 62% 를 따라간다(스크롤과 같이 움직일 뿐, 스크롤을 붙잡지 않는다).
 *  같은 고리에서 머리글 낱말 채우기(시그니처 3)도 돈다. 글 칸은 지나지 않는다 — 여백과 점 줄만 쓴다 */
export function Thread() {
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = svg.current, root = el?.parentElement;
    if (!el || !root) return;
    const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
    root.dataset.motion = reduced ? 'still' : 'on';

    let L = 0, drawn = 0, target = 0, top = 0, darkTop = Infinity, raf = 0, ready = false, closed = false;
    let anchors: Anchor[] = [], dotsAt: { el: HTMLElement; len: number }[] = [];
    let ink: SVGPathElement | null = null, light: SVGPathElement | null = null, tip: SVGCircleElement | null = null;
    const fills = [...root.querySelectorAll<HTMLElement>('[data-fill]')].map((h) => ({ h, ws: [...h.querySelectorAll<HTMLElement>('[data-w]')], n: -1 }));
    const contactAmp = root.querySelector<SVGSVGElement>('[data-amp="contact"]');

    const rel = (e: Element) => { const r = e.getBoundingClientRect(), b = root.getBoundingClientRect(); return { l: r.left - b.left, t: r.top - b.top, r: r.right - b.left, b: r.bottom - b.top, w: r.width, h: r.height }; };

    const build = () => {
      const W = root.clientWidth, H = root.offsetHeight, desk = innerWidth >= 1024;
      top = root.getBoundingClientRect().top + scrollY;
      el.setAttribute('viewBox', `0 0 ${W} ${H}`); el.setAttribute('width', String(W)); el.setAttribute('height', String(H));
      el.replaceChildren();
      const how = root.querySelector<HTMLElement>('#how'), heroAmp = root.querySelector('[data-amp="hero"]');
      const contact = root.querySelector<HTMLElement>('[data-sec="contact"]');
      if (!how || !heroAmp || !contactAmp || !contact) return;
      const cs = getComputedStyle(how), padR = parseFloat(cs.paddingRight);
      const xm = rel(how).r - padR + Math.min(padR * 0.5, 48);   // 오른쪽 여백 가운데(폰은 글 칸 바로 바깥 8px)
      const a = rel(heroAmp), c = rel(contactAmp), sec = rel(contact);
      darkTop = sec.t;

      const m = document.createElementNS(NS, 'path');
      el.appendChild(m);
      let d = '', len = 0;
      anchors = []; dotsAt = [];
      const seg = (part: string, y: number) => { d += part; m.setAttribute('d', d); len = m.getTotalLength(); anchors.push({ len, y }); };

      // & 의 아래 오른쪽 꼬리에서 출발해 여백으로
      const sx = a.l + a.w * 0.93, sy = a.b;
      d = `M${f(sx)} ${f(sy)}`; anchors.push({ len: 0, y: sy - innerHeight * 0.3 });
      seg(` C${f(sx)} ${f(sy + 90)} ${f(xm)} ${f(sy + 40)} ${f(xm)} ${f(sy + 150)}`, sy + 150);

      const dots = [...root.querySelectorAll<HTMLElement>('[data-step-dot]')];
      if (desk && dots.length) {
        const p = dots.map((dt) => { const r = rel(dt); return { el: dt.closest<HTMLElement>('[data-step]')!, x: r.l + r.w / 2, y: r.t + r.h / 2 }; });
        const [first, last] = [p[0], p[p.length - 1]];
        // 첫 점 줄 높이에서 왼쪽으로 꺾어 첫 점으로(이 줄 위에는 글이 없다)
        seg(` L${f(xm)} ${f(first.y - 60)}`, first.y - 140);
        seg(` Q${f(xm)} ${f(first.y)} ${f(xm - 60)} ${f(first.y)} L${f(first.x)} ${f(first.y)}`, first.y);
        dotsAt.push({ el: first.el, len });
        for (let i = 1; i < p.length; i++) {
          const [q0, q1] = [p[i - 1], p[i]], mx = (q0.x + q1.x) / 2;
          seg(` C${f(mx)} ${f(q0.y)} ${f(mx)} ${f(q1.y)} ${f(q1.x)} ${f(q1.y)}`, q1.y);
          dotsAt.push({ el: q1.el, len });
        }
        seg(` L${f(xm - 60)} ${f(last.y)} Q${f(xm)} ${f(last.y)} ${f(xm)} ${f(last.y + 60)}`, last.y + 140);
      }
      // 여백을 따라 문의 장까지 내려가 & 의 윗변 오른쪽으로 들어간다
      const ex = c.l + c.w * 0.86, ey = c.t + c.h * 0.02;
      seg(` L${f(xm)} ${f(ey - 160)}`, ey - 160);
      seg(` C${f(xm)} ${f(ey - 60)} ${f(ex)} ${f(ey - 90)} ${f(ex)} ${f(ey)}`, ey);
      m.remove();
      L = len;
      if (!desk) dotsAt = dots.map((dt) => { const y = rel(dt).t; return { el: dt.closest<HTMLElement>('[data-step]')!, len: lenAt(y) }; });

      el.insertAdjacentHTML('afterbegin', `<defs><clipPath id="thread-dark"><rect x="0" y="${f(sec.t)}" width="${W}" height="${f(H - sec.t)}"/></clipPath></defs>`);
      const mk = (cls: string, clip?: boolean) => {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', d); p.setAttribute('class', cls);
        p.style.strokeDasharray = `${L} ${L}`;
        if (clip) p.setAttribute('clip-path', 'url(#thread-dark)');
        el.appendChild(p); return p;
      };
      ink = mk(s.threadInk); light = mk(`${s.threadInk} ${s.threadLight}`, true);
      tip = document.createElementNS(NS, 'circle'); tip.setAttribute('r', '4.5'); tip.setAttribute('class', s.threadTip); el.appendChild(tip);
      if (reduced) drawn = L;
      paint();
    };
    const lenAt = (y: number) => {
      if (!anchors.length || y <= anchors[0].y) return 0;
      for (let i = 1; i < anchors.length; i++) {
        const [p, q] = [anchors[i - 1], anchors[i]];
        if (y <= q.y) return p.len + (q.len - p.len) * clamp((y - p.y) / Math.max(1, q.y - p.y));
      }
      return L;
    };
    const paint = () => {
      if (!ink || !light || !tip) return;
      const off = f(L - drawn);
      ink.style.strokeDashoffset = off; light.style.strokeDashoffset = off;
      const pt = ink.getPointAtLength(drawn);
      tip.setAttribute('cx', f(pt.x)); tip.setAttribute('cy', f(pt.y));
      tip.toggleAttribute('data-on', drawn > 2 && drawn < L - 2);
      tip.toggleAttribute('data-dark', pt.y > darkTop);
      for (const dt of dotsAt) dt.el.toggleAttribute('data-on', drawn >= dt.len - 1);
      if (!closed && drawn >= L - 4 && contactAmp) { closed = true; contactAmp.dataset.drawn = ''; }
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
    const tick = () => {
      raf = 0;
      if (!ready) return;
      target = lenAt(scrollY - top + innerHeight * 0.62);
      words();
      const diff = target - drawn;
      if (reduced || Math.abs(diff) < 0.4) { drawn = reduced ? L : target; paint(); return; }
      drawn += diff * 0.16;
      paint();
      raf = requestAnimationFrame(tick);
    };
    const wake = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const begin = () => { ready = true; build(); wake(); };

    let rz = 0;
    const onResize = () => { clearTimeout(rz); rz = window.setTimeout(() => { build(); wake(); }, 150); };
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
    };
  }, []);

  return <svg ref={svg} className={s.thread} aria-hidden="true" data-thread />;
}
