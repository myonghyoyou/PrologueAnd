'use client';
import { useEffect, useRef } from 'react';
import { AMP_H, AMP_TIP, AMP_VB, AMP_MAIN } from './amp-path';
import { enterPlan, enterEase, dash, bandOf, band, ENTER_END, MAIN_END_SPEED } from './amp-enter';
import s from './home.module.css';

const NS = 'http://www.w3.org/2000/svg';
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const f = (n: number) => n.toFixed(1);
type Anchor = { len: number; y: number };
type Box = { l: number; t: number; r: number; b: number; w: number; h: number };
type Pt = [number, number];
/** 꺾은선 점 — 셋째 값이 있으면 그 모서리만 그 반지름으로 둥글린다 */
type Wp = [number, number] | [number, number, number];

/** 홈을 잇는 선(시그니처 2) — 한 가닥이 장면마다 다른 일을 하고, 일이 없는 구간은 조용히 지나간다.
 *  첫 & 의 받침 꼬리 끝에서 가로로 나와 → 오른쪽 길로 내려와 02 머리 선(가로 구분선)의 오른쪽 끝에서 그 선을 이어받아 왼쪽 끝까지 가고 → 「불편한지」 밑에 받침을 대고(찾기)
 *  → 단계 사이 빈 칸으로 내려와(짓기는 글만) → 오픈 후 수정 옆에서 예전 경로(흐린 점선)의 한 구간만 곧게 고친다(고치기)
 *  → 서비스 두 묶음 사이 구분선을 이어받아 나누고(나누기) → 04 머리 선을 이어받다 작업 머리 사이 빈 칸으로 빠져 요청 처리 화면에 들어간다(들어가기, 네 갈래 요청은 흐린 보조선)
 *  → 문제 은행·병원 화면 뒤로 조용히 지나 → 근무표 확대 자리를 원본 위에 테두리로 짚고(짚기) → 「모든 작업」 구분선을 이어받아 오른쪽 끝에서 빠져
 *  → 마지막 & 의 받침 꼬리 끝으로 가로로 들어가 뼈대를 그린 뒤 굵기가 채워진다(완성). 구분선과 만나는 모서리는 그 선의 끝에서 꺾인다(이중선이 생기지 않게).
 *  실제 화면 그림 안에서는 가려지고(그림 뒤로 지나간다), 글 칸은 지나지 않는다. 정지 화면 보드: docs/superpowers/specs/2026-10-29-home-motion-p2.md 10절.
 *  선 끝은 화면 높이 62% 를 따라간다(스크롤을 붙잡지 않는다). 같은 고리에서 머리글 낱말 채우기(시그니처 3)와 남색 헤더 전환도 돈다 */
export function Thread() {
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = svg.current, root = el?.parentElement;
    if (!el || !root) return;
    const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
    root.dataset.motion = reduced ? 'still' : 'on';

    // 선 길이·높이 짝, 그리기 상태
    let L = 0, minLen = 0, top = 0, darkTop = Infinity, aIn = 0, maxT = 0, raf = 0, ready = false, yS = -1;
    let anchors: Anchor[] = [], aux: { el: SVGElement; len: number }[] = [];
    let ink: SVGPathElement | null = null, light: SVGPathElement | null = null, tip: SVGCircleElement | null = null;
    let ampBox: Box | null = null;
    const fills = [...root.querySelectorAll<HTMLElement>('[data-fill]')].map((h) => ({ h, ws: [...h.querySelectorAll<HTMLElement>('[data-w]')], n: -1 }));
    const contactAmp = root.querySelector<SVGSVGElement>('[data-amp="contact"]');
    /** 문의 장 & 의 가닥과 그리는 차례 — 들어온 선이 주된 가닥(아래 가로 끝 → 사선 → 위 고리 꼭대기, 이어서 같은 번호 고리)을 먼저 그리고,
     *  이웃 가닥이 같은 길을 뒤따른 뒤 오른쪽 내림획·위 가로획이 더해진다. a·b: 남은 스크롤 비율에서 그 가닥이 그려지는 구간, rev: 끝(오른쪽 아래)에서부터 */
    const order = (id: string, g: string): { a: number; b: number; rev: boolean } =>
      id === AMP_MAIN.diag ? { a: 0, b: 0.3, rev: true } : id === AMP_MAIN.loops ? { a: 0.3, b: 0.55, rev: false }
        : g === 'diag' ? { a: 0.4, b: 0.75, rev: true } : g === 'loops' ? { a: 0.55, b: 0.85, rev: false } : { a: 0.72, b: 1, rev: false };
    const strands = [...(contactAmp?.querySelectorAll<SVGPathElement>('[data-line]') ?? [])].map((p) => ({ p, len: 0, ...order(p.dataset.line ?? '', p.dataset.group ?? '') }));
    const mainD = strands.find((x) => x.p.dataset.line === AMP_MAIN.diag), mainL = strands.find((x) => x.p.dataset.line === AMP_MAIN.loops);
    const contactSec = root.querySelector<HTMLElement>('[data-sec="contact"]');

    // 첫 & 등장(amp-enter.ts) — eT: 등장 시계(ms), cap: 페이지 선이 그려져도 되는 길이(등장이 끝나면 주된 가닥 끝 속도로 늘어나 스크롤 자리를 따라잡는다)
    const html = document.documentElement, heroSvg = root.querySelector<SVGSVGElement>('[data-amp="hero"]');
    const enters = [...(heroSvg?.querySelectorAll<SVGPathElement>('[data-line]') ?? [])].map((p) => ({ p, len: 0, ...enterPlan(p.dataset.group ?? '', Number(p.dataset.line?.slice(-1))) }));
    const lead = enters.find((x) => x.p.dataset.line === 'diagonal-line-1'), main = enters.find((x) => x.main);
    let entering = html.dataset.ampIn === 'on' && !reduced && !!lead && !!main && scrollY < 2 && !location.hash;
    if (!entering) delete html.dataset.ampIn;
    const bands = entering && heroSvg && lead ? [...heroSvg.querySelectorAll<SVGPathElement>('mask path')].map((p) => bandOf(p, lead.p)) : [];
    let eT = entering ? 0 : ENTER_END, cap = entering ? 0 : Infinity, capK = 0, heroBox: Box | null = null;
    let enterTip: { x: number; y: number } | null = null;

    const rel = (e: Element): Box => { const r = e.getBoundingClientRect(), b = root.getBoundingClientRect(); return { l: r.left - b.left, t: r.top - b.top, r: r.right - b.left, b: r.bottom - b.top, w: r.width, h: r.height }; };
    /** 요소 안 글자가 실제로 닿는 오른쪽 끝 */
    const textR = (...es: (Element | null | undefined)[]) => {
      const b = root.getBoundingClientRect(); let r = -Infinity;
      for (const e of es) {
        if (!e) continue;
        const rg = document.createRange(); rg.selectNodeContents(e);
        for (const x of rg.getClientRects()) if (x.width > 0) r = Math.max(r, x.right - b.left);
      }
      return r;
    };
    const want = (y: number) => Math.max(lenAt(y), minLen);
    const lenAt = (y: number) => {
      if (!anchors.length || y <= anchors[0].y) return 0;
      for (let i = 1; i < anchors.length; i++) {
        const [p, q] = [anchors[i - 1], anchors[i]];
        if (y <= q.y) return p.len + (q.len - p.len) * clamp((y - p.y) / Math.max(1, q.y - p.y));
      }
      return L;
    };

    const build = () => {
      const W = root.clientWidth, H = root.offsetHeight, phone = innerWidth < 1024, vh = innerHeight;
      if (heroSvg) { heroBox = rel(heroSvg); for (const x of enters) x.len = x.p.getTotalLength() * (heroBox.h / AMP_H); }
      top = root.getBoundingClientRect().top + scrollY;
      maxT = document.documentElement.scrollHeight - vh - top + vh * 0.62 - 8;   // 맨 끝까지 내렸을 때 선 끝이 닿는 높이
      el.setAttribute('viewBox', `0 0 ${W} ${H}`); el.setAttribute('width', String(W)); el.setAttribute('height', String(H));
      el.replaceChildren();
      aux = []; ink = light = tip = null;
      const q = (sel: string) => root.querySelector<HTMLElement>(sel);
      const how = q('#how'), heroAmp = root.querySelector('[data-amp="hero"]'), heroFoot = q(`.${s.heroFoot}`), howSh = q(`#how .${s.sh}`);
      const find = q('[data-mark="find"]'), [st1, st2, st3] = [1, 2, 3].map((i) => q(`[data-step="${i}"]`));
      const rows = [...root.querySelectorAll('[data-can]')];
      const workSh = q(`#work .${s.sh}`), workT = q(`.${s.workT}`), workSide = q(`.${s.workSide}`);
      const pfhCase = q('[data-layout="wide"]'), pfh = pfhCase?.querySelector('[data-under]'), tabs = pfhCase?.querySelector(`.${s.twoBtns}`);
      const pb1 = q('[data-layout="phones"] [data-under]'), pair = q('[data-layout="pair"]'), hux = pair?.querySelector('[data-under]');
      const full = q('[data-layout="full"]'), shift = full?.querySelector(`.${s.fullPic} [data-under]`), crop = full?.querySelector('[data-detail] [data-under]');
      if (!how || !heroAmp || !heroFoot || !contactAmp || !contactSec || !howSh || !find || !st1 || !st2 || !st3 || rows.length < 4 || !workSh || !workT || !workSide
        || !pfhCase || !pfh || !pb1 || !pair || !hux || !full || !shift || !crop) return;
      const cs = getComputedStyle(how), padL = parseFloat(cs.paddingLeft), padR = parseFloat(cs.paddingRight);
      const CL = rel(how).l + padL, CR = rel(how).r - padR;
      const xR = phone ? CR + 8 : CR + Math.min(padR * 0.5, 48);     // 오른쪽 길(폰은 글 칸 바로 바깥)
      const xL = phone ? CL - 9 : CL - 30;                            // 왼쪽 길
      const a = rel(heroAmp), c = rel(contactAmp), sec = rel(contactSec);
      darkTop = sec.t; ampBox = c;

      const m = document.createElementNS(NS, 'path');
      el.appendChild(m);
      // 출구: 첫 & 의 받침 꼬리 끝 — 받침이 가늘어진 그 방향(오른쪽)으로 그대로 나간다
      const ha = a.h / AMP_H, hx = a.l + AMP_TIP.x * ha, hy = a.t + AMP_TIP.y * ha;
      let d = `M${f(hx)} ${f(hy)}`;
      let cur: Pt = [hx, hy];
      /** 꺾이는 곳을 둥글린 꺾은선 — 지금 점에서 pts 를 차례로 지난다(마지막 점에서 멈춘다) */
      const go = (pts: Wp[], r = 56) => {
        let prev = cur;
        pts.forEach((p, i) => {
          const nx = pts[i + 1];
          if (!nx) { d += ` L${f(p[0])} ${f(p[1])}`; return; }
          const la = Math.hypot(prev[0] - p[0], prev[1] - p[1]) || 1, lb = Math.hypot(nx[0] - p[0], nx[1] - p[1]) || 1, t = Math.min(p[2] ?? r, la / 2, lb / 2);
          const p1: Pt = [p[0] + ((prev[0] - p[0]) / la) * t, p[1] + ((prev[1] - p[1]) / la) * t], p2: Pt = [p[0] + ((nx[0] - p[0]) / lb) * t, p[1] + ((nx[1] - p[1]) / lb) * t];
          d += ` L${f(p1[0])} ${f(p1[1])} C${f(p1[0] + (p[0] - p1[0]) * 0.55)} ${f(p1[1] + (p[1] - p1[1]) * 0.55)} ${f(p2[0] + (p[0] - p2[0]) * 0.55)} ${f(p2[1] + (p[1] - p2[1]) * 0.55)} ${f(p2[0])} ${f(p2[1])}`;
          prev = [p[0], p[1]];
        });
        const e = pts.at(-1)!; cur = [e[0], e[1]];
      };
      /** 지금까지 그린 선 길이 — 보조 획은 선이 이 길이까지 오면 보인다 */
      const here = () => { m.setAttribute('d', d); return m.getTotalLength(); };
      const addAux = (tag: 'path' | 'circle' | 'text' | 'rect', at: Record<string, string>, cls: string, text?: string) => {
        const e = document.createElementNS(NS, tag);
        for (const [k, v] of Object.entries(at)) e.setAttribute(k, v);
        e.setAttribute('class', cls);
        if (text) e.textContent = text;
        aux.push({ el: e, len: here() });
      };
      /** 보조 이름이 화면 왼쪽 8px 안에 들어오는지 — 들어오지 않으면 그 보조 획은 그리지 않는다 */
      const fits = (right: number, ts: string[]) => ts.every((t) => {
        const e = document.createElementNS(NS, 'text'); e.setAttribute('class', s.threadLab); e.textContent = t; el.appendChild(e);
        const wd = e.getComputedTextLength(); e.remove(); return right - wd >= 8;
      });

      // 찾기 — 「불편한지」 밑에만 받침을 댄다(글자와 12px 띄운다)
      // 02 머리 선(가로 구분선, 1px)의 가운데 높이 — 선은 그 오른쪽 끝에서 들어와 구분선을 이어받는다(모서리 반지름 = 길과 구분선 끝 사이)
      const sh = rel(howSh), rY = sh.t + 0.5, w = rel(find), lead = rel(find.closest('h2')!), wb = w.b + 12;
      if (!phone) {
        // 구분선을 왼쪽 끝(「02 일하는 방식」 위)까지 따라가 왼쪽 길로 빠지고, 머리글 아래로 비스듬히 올라와 낱말 밑을 받친다
        go([[xR, hy, 40], [xR, rY, xR - CR], [xL, rY, CL - xL], [xL, rY + 60]]);
        go([[xL, wb + 64], [w.l - 22, wb], [w.r + 6, wb], [w.r + 6, wb + 24]], 28);
      } else {
        // 폰은 줄이 바뀌어 낱말 아래·앞에 다른 글이 붙는다. 낱말 오른쪽이 비어 있으면 오른쪽 길에서 낱말 끝까지 와서 짚고 돌아간다(받침 대신 가리키기).
        // 오른쪽에 글이 이어지면(넓은 폰·태블릿) 오른쪽 길에서 낱말 밑을 받치고 머리글 아래로 내려가 돌아간다
        const rb0 = root.getBoundingClientRect(), rg = document.createRange(); rg.selectNodeContents(find.closest('h2')!);
        const after = [...rg.getClientRects()].some((x) => x.width > 2 && x.left - rb0.left > w.r + 2 && Math.abs((x.top + x.bottom) / 2 - rb0.top - (w.t + w.b) / 2) < w.h / 2);
        const my = w.t + w.h / 2;
        // 폰도 02 머리 선을 오른쪽 끝에서 이어받아, 낱말 오른쪽 위에서 빠져 내려와 낱말 끝을 짚고 오른쪽 길로 돌아간다
        if (!after) go([[xR, hy, 8], [xR, rY, xR - CR], [w.r + 18, rY, 10], [w.r + 18, my, 10], [xR, my, 10], [xR, my + 60]]);
        else go([[xR, hy, 8], [xR, wb, 14], [w.l - 8, wb, 14], [w.l - 8, lead.b + 22, 14], [xR, lead.b + 22, 14], [xR, lead.b + 60]]);
      }

      // 짓기 — 단계 사이 빈 칸으로 내려온다(선은 거들지 않는다). 폰은 오른쪽 길로
      const b1 = rel(st1), b2 = rel(st2), b3 = rel(st3);
      const cX = phone ? xR : (Math.max(textR(st1), textR(st3)) + b2.l) / 2;
      // 고치기 — 오픈 후 수정 옆 빈 칸: 예전 경로(흐린 점선)가 한 구간에서 어긋나 있고, 선은 그 구간만 곧게 다시 긋는다. 고친 범위 양끝에 눈금
      const yc = phone ? b3.b + 40 : b3.t + b3.h * 0.5, xa = cX, xb = phone ? xL : xR;
      go([[cX, Math.max(cur[1] + 40, b1.t)], [cX, yc], [xb, yc]], phone ? 24 : 48);
      const span = xb - xa, ra = xa + span * 0.3, rb = xa + span * 0.7, zs = (rb - ra) / 5, z = phone ? 16 : 26;
      m.setAttribute('d', d);
      const zig: Pt[] = [[ra, yc], [ra + zs, yc + z], [ra + zs * 2, yc + z * 0.25], [ra + zs * 3, yc + z * 1.15], [ra + zs * 4, yc + z * 0.4], [rb, yc]];
      // 보조 획은 선이 그 구간에 닿을 때 보인다 — 길이는 시작 눈금 자리까지로 잰다
      const dSave = d; d = d.replace(/ L[^LC]*$/, '') + ` L${f(ra)} ${f(yc)}`;
      addAux('path', { d: 'M' + zig.map((p) => `${f(p[0])} ${f(p[1])}`).join(' L') }, s.threadOld);
      for (const x of [ra, rb]) addAux('path', { d: `M${f(x)} ${f(yc - 10)} L${f(x)} ${f(yc + 10)}` }, s.threadAux);
      d = dSave;

      // 서비스 — 선은 목록 안으로 들어가지 않는다(분류와 제목이 먼저 읽히게, 목록을 감싸지 않게).
      // 데스크톱은 오른쪽 길로 지나 04 머리 선을 오른쪽 끝에서 이어받고, 폰은 왼쪽 길로 지나 04 머리 선을 왼쪽 끝에서 이어받아 오른쪽 길로 건너간다
      const wy = rel(workSh).t + 0.5;

      // 들어가기 — 작업 머리(큰 제목과 옆 글) 사이 빈 칸으로 내려와 요청 처리 화면 위로 들어간다(화면 안에서는 가려진다).
      // 네 갈래 요청(전화·메신저·메일·자리 방문)은 흐린 보조선으로 화면 왼쪽 가장자리 네 곳에 닿는다 — 선이 갈라지는 것이 아니라 흩어져 오던 요청
      const pf = rel(pfh);
      const tabR = tabs ? textR(...tabs.children) : pf.l;
      if (!phone) {
        const cw = clamp((textR(workT) + rel(workSide).l) / 2, tabR + 32, pf.r - 32);
        // 04 머리 선을 오른쪽 끝에서 이어받아 큰 제목과 옆 글 사이까지 와서 빠져나와 아래로
        go([[xR, wy, xR - CR], [cw, wy, 40], [cw, pf.t + 40]]);
        const ways = ['전화', '메신저', '메일', '자리 방문'];
        if (fits(pf.l - 46, ways)) ways.forEach((t, i) => {
          const y = pf.t + pf.h * (0.22 + i * 0.17), y0 = pf.t + pf.h * (0.3 + i * 0.12);
          addAux('path', { d: `M${f(pf.l - 40)} ${f(y)} C${f(pf.l - 18)} ${f(y)} ${f(pf.l - 16)} ${f(y0)} ${f(pf.l)} ${f(y0)}` }, s.threadReq);
          addAux('circle', { cx: f(pf.l), cy: f(y0), r: '2.5' }, s.threadReqDot);
          addAux('text', { x: f(pf.l - 46), y: f(y + 4), 'text-anchor': 'end' }, s.threadLab, t);
        });
        // 그림 아래로 나와(캡션 오른쪽) 문제 은행 학습 홈 위로 — 화면 뒤로 지나 아래로 나온다
        const p1 = rel(pb1), oX = pf.r - 60, p1x = p1.l + p1.w / 2, p1o = p1.r - 20;
        d += ` L${f(cw)} ${f(pf.b - 40)} L${f(oX)} ${f(pf.b)} C${f(oX)} ${f(pf.b + 140)} ${f(p1x)} ${f(p1.t - 160)} ${f(p1x)} ${f(p1.t)} L${f(p1o)} ${f(p1.b)}`;
        cur = [p1o, p1.b];
        // 병원 — 글 두 칸 사이 빈 칸으로 내려와 비교 화면 뒤로 지난다(비교 안에서는 보이지 않는다). 나올 때는 캡션 오른쪽으로
        const hb = rel(hux), left = pair.querySelectorAll(`.${s.pairTxt} > :not(dl)`), qa = pair.querySelector('dl');
        const ch = (textR(...left) + (qa ? rel(qa).l : hb.r)) / 2;
        const caps = [...root.querySelectorAll(`#work .${s.cap}`)].map(rel).filter((x) => x.t > p1.b - 4 && x.b < hb.t);
        const yb = Math.max(p1.b, ...caps.map((x) => x.b)) + 28;
        const fullTxt = full.querySelector(`.${s.fullTxt}`), xs = clamp(textR(fullTxt) + 40, textR(hux.parentElement?.querySelector('figcaption')) + 24, hb.r - 24);
        go([[p1o, yb], [ch, yb + 90], [ch, hb.t + 30]], 48);
        d += ` L${f(xs)} ${f(hb.b)}`; cur = [xs, hb.b];
      } else {
        // 폰: 작업 장은 오른쪽 길로만 — 그림이 글보다 먼저 와서, 안으로 들어가면 글을 가로지른다
        go([[xL, wy, CL - xL], [xR, wy, xR - CR], [xR, wy + 60]]);
      }

      // 짚기 — 근무표: 확대 그림이 원본의 어느 자리인지 원본 위에 테두리로 짚는다(첫 화면일 때만 보인다). 선은 원본·확대 뒤로 지난다
      const sf = rel(shift), cr = rel(crop), dt = q('[data-layout="full"] [data-detail] [data-zoom-crop]')?.dataset.zoomCrop?.split(',').map(Number) ?? [0, 0, 40, 21];
      const zx = sf.l + (sf.w * dt[0]) / 100, zy = sf.t + (sf.h * dt[1]) / 100, zw = (sf.w * dt[2]) / 100, zh = (sf.h * dt[3]) / 100;
      if (!phone) go([[cur[0], sf.t + 40]], 8);
      else go([[xR, sf.t + zh * 0.5]], 24);
      addAux('rect', { x: f(zx + 3), y: f(zy + 3), width: f(zw - 6), height: f(zh - 6), rx: '3' }, `${s.threadAux} ${s.threadZoom}`);
      if (!phone) { d += ` L${f(cur[0])} ${f(cr.b)}`; cur = [cur[0], cr.b]; }

      // 입구 — 데스크톱은 「모든 작업」 구분선을 이어받아 오른쪽 끝에서 빠지고, 오른쪽 길로 내려와 마지막 & 의 받침 꼬리 끝으로 가로로 들어간다
      const hc = c.h / AMP_H, ax = c.l + AMP_TIP.x * hc, ay = c.t + AMP_TIP.y * hc, allEl = q(`.${s.all}`);
      if (!phone && allEl) { const ay0 = rel(allEl).t + 0.5; go([[cur[0], ay0, 40], [xR, ay0, xR - CR], [xR, ay, xR - ax], [ax, ay]]); }
      else go([[xR, ay, Math.max(4, xR - ax)], [ax, ay]]);
      L = here();
      // 맨 위에서도 선은 & 발끝에서 나와 오른쪽 길로 꺾여 내려가는 데까지는 보인다 — 긴 선으로 이어진다는 것이 읽히게
      minLen = 0;
      for (let l = 0; l < Math.min(L, 800); l += 4) if (m.getPointAtLength(l).y >= hy + 28) { minLen = l; break; }

      // 스크롤 높이 ↔ 선 길이: 선 위 점의 높이를 따라가되(지나온 가장 낮은 곳) 가로로 가는 구간에도 조금씩 스크롤을 준다.
      // 들어가는 지점은 맨 끝에서 traceRun 만큼 앞 — 남은 스크롤로 & 를 그린다
      const traceRun = Math.min(360, vh * 0.4), end = Math.max(Math.min(ay, maxT - traceRun), hy);
      // 긴 선 전체에 getPointAtLength 를 수천 번 부르면 1초 넘게 멈춘다 — 명령 하나씩 짧은 path 로 재며 8px 마다 뽑는다
      anchors = [{ len: 0, y: hy - vh * 0.35 }];
      let at = 0, y = anchors[0].y, px = hx, py = hy;
      for (const cmd of d.match(/[LCQ][^MLCQ]*/g) ?? []) {
        m.setAttribute('d', `M${px} ${py} ${cmd}`);
        const n = cmd.slice(1).trim().split(/[\s,]+/).slice(-2).map(Number), sl = m.getTotalLength();
        for (let l = 8; l < sl; l += 8) { y = Math.max(y + 1.2, m.getPointAtLength(l).y); anchors.push({ len: at + l, y }); }
        at += sl; px = n[0]; py = n[1];
      }
      m.remove();
      anchors.push({ len: L, y: Math.max(anchors.at(-1)!.y + 1, end) });
      // 끝이 들어가야 할 높이를 넘으면 전체를 고르게 줄인다
      const y0 = anchors[0].y, lastY = anchors.at(-1)!.y;
      if (lastY > end && end > y0) for (const an of anchors) an.y = y0 + (an.y - y0) * (end - y0) / (lastY - y0);
      aIn = anchors.at(-1)!.y;

      // & 가닥 길이 — 선 굵기가 화면 기준(vector-effect)이라 점선 길이도 화면 px 로 잰다(& 의 화면 배율을 곱한다)
      for (const x of strands) x.len = x.p.getTotalLength() * (c.h / AMP_H);

      // 실제 화면 그림 안에서는 선이 가려진다(그림 뒤로 지나간다). 남색 문의 장 안에서는 밝은 선
      const under = [...root.querySelectorAll('[data-under]')].map(rel).filter((u) => u.w > 0);
      el.insertAdjacentHTML('afterbegin', `<defs><mask id="thread-under" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/>${under.map((u) => `<rect x="${f(u.l)}" y="${f(u.t)}" width="${f(u.w)}" height="${f(u.h)}" fill="#000"/>`).join('')}</mask><clipPath id="thread-dark"><rect x="0" y="${f(sec.t)}" width="${W}" height="${f(H - sec.t)}"/></clipPath></defs>`);
      const mk = (cls: string, clip?: boolean) => {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', d); p.setAttribute('class', cls); p.setAttribute('mask', 'url(#thread-under)');
        if (clip) p.setAttribute('clip-path', 'url(#thread-dark)');
        el.appendChild(p); return p;
      };
      ink = mk(s.threadInk); light = mk(`${s.threadInk} ${s.threadLight}`, true);
      for (const x of aux) el.appendChild(x.el);   // 순서: 선 · 밝은 선 · 보조 획
      tip = document.createElementNS(NS, 'circle'); tip.setAttribute('r', '4.5'); tip.setAttribute('class', s.threadTip); el.appendChild(tip);
      yS = -1;
      paint(reduced ? Infinity : scrollY - top + vh * 0.62);
    };

    /** y: 선 끝이 따라갈 높이(부드럽게 따라간 값) */
    const paint = (y: number) => {
      if (!ink || !light || !tip) return;
      const drawn = reduced ? L : Math.min(want(y), cap);
      for (const p of [ink, light]) p.style.strokeDasharray = `${f(drawn)} ${f(L + 40)}`;
      for (const x of aux) x.el.toggleAttribute('data-on', drawn >= x.len - 1);
      // & 그리기: 꼬리 끝(주된 가닥 끝)에 닿은 뒤 남은 스크롤이 가닥을 차례로 그린다. 다 그린 가닥은 점선을 풀어 원본과 똑같이 둔다
      const k = reduced ? 1 : clamp((y - aIn) / Math.max(1, maxT - aIn));
      for (const x of strands) dash(x.p, x.len, clamp((k - x.a) / (x.b - x.a)), x.rev ? 'rev' : 'fwd');
      contactAmp?.toggleAttribute('data-drawn', k >= 0.995);
      // 선 끝 점: 첫 & 주된 가닥이 그려지는 동안은 그 머리, 마지막 & 주된 가닥을 그리는 동안은 그 가닥 위(사선 구간은 끝에서부터, 고리 구간은 꼭대기에서부터)
      let pt: { x: number; y: number }, onAmp = false;
      if (enterTip) { pt = enterTip; onAmp = true; }
      else if (k > 0 && k < 0.55 && mainD && mainL && ampBox) {
        const sc = ampBox.h / AMP_H, x = k < 0.3 ? mainD : mainL, t = clamp((k - x.a) / (x.b - x.a)), L0 = x.len / sc;
        const q = x.p.getPointAtLength(x.rev ? L0 * (1 - t) : L0 * t);
        pt = { x: ampBox.l + (q.x - AMP_VB[0]) * sc, y: ampBox.t + (q.y - AMP_VB[1]) * sc }; onAmp = true;
      } else pt = ink.getPointAtLength(drawn);
      tip.setAttribute('cx', f(pt.x)); tip.setAttribute('cy', f(pt.y));
      tip.toggleAttribute('data-on', !reduced && (drawn > 2 || !!enterTip) && (k <= 0 || onAmp));
      tip.toggleAttribute('data-dark', pt.y > darkTop);
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

    /** 첫 & 가닥을 등장 시계 et 에 맞춰 그린다. 다 그렸으면 원본 그대로 두고 표식을 거둔다 */
    const paintEnter = (et: number) => {
      let fl = 0;
      enterTip = null;
      for (const x of enters) {
        const e = enterEase(x, clamp((et - x.a) / (x.b - x.a)));
        dash(x.p, x.len, et >= ENTER_END ? 1 : e, x.mode, x.s, et < ENTER_END);
        if (x === lead) fl = e;
        if (x.main && e > 0 && e < 1 && heroBox) {
          const L0 = x.p.getTotalLength(), q = x.p.getPointAtLength(L0 * e), sc = heroBox.h / AMP_H;
          enterTip = { x: heroBox.l + (q.x - AMP_VB[0]) * sc, y: heroBox.t + (q.y - AMP_VB[1]) * sc };
        }
      }
      for (const b of bands) band(b, et >= ENTER_END ? 1 : fl, et < ENTER_END);
      if (et >= ENTER_END) { enterTip = null; delete html.dataset.ampIn; }
    };
    /** 등장 고리 — 스크롤이 들어오면 남은 & 를 세 배 빠르게 마치고, 크게 건너뛰면(새로고침 복원·끝으로) 바로 완성.
     *  & 가 다 그려지면 페이지 선이 주된 가닥 끝 속도로 출발해, 스크롤 자리까지 점점 느려지며 따라잡는다(그 뒤로는 평소처럼 스크롤만 따른다) */
    let eRaf = 0, eLast = 0, eFast = false, sy0 = scrollY;
    const enterTick = (now: number) => {
      const dt = Math.min(64, eLast ? now - eLast : 16); eLast = now;
      if (Math.abs(scrollY - sy0) > innerHeight * 1.5) { eT = ENTER_END; cap = Infinity; }
      else if (Math.abs(scrollY - sy0) > 0.5) eFast = true;
      sy0 = scrollY;
      if (eT < ENTER_END || bands.length) {
        if (eT < ENTER_END) eT = Math.min(ENTER_END, eT + dt * (eFast ? 3 : 1));
        paintEnter(eT);
        if (eT >= ENTER_END) bands.length = 0;
      } else if (cap < Infinity) {
        const target = want(yS < 0 ? scrollY - top + innerHeight * 0.62 : yS);
        if (!capK && main) capK = clamp((MAIN_END_SPEED * main.len) / (main.b - main.a) / Math.max(1, target - cap), 0.0025, 0.012);
        cap += Math.max(0.06, (target - cap) * capK) * dt;
        if (cap >= target - 0.5) cap = Infinity;
      }
      if (ready) paint(yS < 0 ? scrollY - top + innerHeight * 0.62 : yS);
      if (eT < ENTER_END || cap < Infinity) eRaf = requestAnimationFrame(enterTick);
      else eRaf = 0;
    };
    const begin = () => {
      ready = true; build(); wake();
      if (entering) { (window as unknown as { __ampIn?: boolean }).__ampIn = true; paintEnter(0); eRaf = requestAnimationFrame(enterTick); }
    };

    let rz = 0;
    const onResize = () => { clearTimeout(rz); rz = window.setTimeout(() => { if (ready) build(); wake(); }, 150); };
    const ro = new ResizeObserver(onResize);
    ro.observe(root);
    addEventListener('scroll', wake, { passive: true });
    document.fonts?.ready.then(onResize);
    begin();
    return () => {
      cancelAnimationFrame(raf); cancelAnimationFrame(eRaf); clearTimeout(rz); ro.disconnect();
      removeEventListener('scroll', wake);
      if (eT < ENTER_END) { eT = ENTER_END; paintEnter(eT); }
      delete root.dataset.motion;
      document.documentElement.removeAttribute('data-hdr-dark');
    };
  }, []);

  return <svg ref={svg} className={s.thread} aria-hidden="true" data-thread />;
}
