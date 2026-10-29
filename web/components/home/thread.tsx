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

/** 홈을 잇는 선(시그니처 2) — 장면마다 하는 일이 바뀌는 한 가닥.
 *  첫 & 받침 획 끝에서 가늘어지며 나와(출구) → 「불편한지」를 감싸고(찾기) → 설계와 개발을 화면 틀로 그리고(짓기)
 *  → 「확인해서 고칩니다」에 밑줄과 되돌아오는 고리(고치기) → 서비스 두 묶음을 괄호로(묶기)
 *  → 요청 처리 화면으로 네 갈래가 모여 들어가고(들어가기) → 문제 은행 두 화면을 잇고(잇기) → 병원 비교의 가운데로(가르기)
 *  → 근무표 전체에서 확대로(짚기) → 마지막 & 의 같은 받침 획 끝으로 들어가(입구) 그 & 를 그린 뒤 채운다(완성).
 *  실제 화면 그림 안에서는 가려지고(그림 뒤로 지나간다), 글 칸은 지나지 않는다. 정지 화면 보드: docs/superpowers/specs/2026-10-29-home-motion-p2.md 9절.
 *  선 끝은 화면 높이 62% 를 따라간다(스크롤을 붙잡지 않는다). 같은 고리에서 머리글 낱말 채우기(시그니처 3)와 남색 헤더 전환도 돈다 */
export function Thread() {
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = svg.current, root = el?.parentElement;
    if (!el || !root) return;
    const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
    root.dataset.motion = reduced ? 'still' : 'on';

    // 선 길이·높이 짝, 그리기 상태
    let L = 0, top = 0, darkTop = Infinity, aIn = 0, maxT = 0, raf = 0, ready = false, yS = -1, taperLen = 0;
    let anchors: Anchor[] = [], aux: { el: SVGElement; len: number }[] = [];
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
      const W = root.clientWidth, H = root.offsetHeight, phone = innerWidth < 1024, vh = innerHeight;
      top = root.getBoundingClientRect().top + scrollY;
      maxT = document.documentElement.scrollHeight - vh - top + vh * 0.62 - 8;   // 맨 끝까지 내렸을 때 선 끝이 닿는 높이
      el.setAttribute('viewBox', `0 0 ${W} ${H}`); el.setAttribute('width', String(W)); el.setAttribute('height', String(H));
      el.replaceChildren();
      aux = []; ink = light = tip = taper = null;
      const q = (sel: string) => root.querySelector<HTMLElement>(sel);
      const how = q('#how'), heroAmp = root.querySelector('[data-amp="hero"]'), howSh = q(`#how .${s.sh}`), canSh = q(`#can .${s.sh}`);
      const find = q('[data-mark="find"]'), fix = q('[data-mark="fix"]'), st2 = q('[data-step="2"]'), st3 = q('[data-step="3"]');
      const rows = [...root.querySelectorAll('[data-can]')];
      const pfh = q('[data-layout="wide"] [data-under]'), [pb1, pb2] = [...root.querySelectorAll('[data-layout="phones"] [data-under]')];
      const hux = q('[data-layout="pair"] [data-under]'), shift = q('[data-layout="full"] .' + s.fullPic + ' [data-under]'), crop = q('[data-layout="full"] [data-detail] [data-under]');
      if (!how || !heroAmp || !contactAmp || !contactSec || !howSh || !canSh || !find || !fix || !st2 || !st3 || rows.length < 4
        || !pfh || !pb1 || !pb2 || !hux || !shift || !crop) return;
      const cs = getComputedStyle(how), padL = parseFloat(cs.paddingLeft), padR = parseFloat(cs.paddingRight);
      const CL = rel(how).l + padL, CR = rel(how).r - padR;
      const xr = CR + Math.min(padR * 0.5, 48);                     // 오른쪽 이동 길(여백 가운데)
      const gR = phone ? CR + 8 : xr;                                // 폰은 글 칸 바로 바깥
      const a = rel(heroAmp), c = rel(contactAmp), sec = rel(contactSec);
      darkTop = sec.t; ampBox = c;

      // 출구: 첫 & 받침 획 끝 — 획 두께에서 선 두께로 가늘어지며 빠져나온다(별도 선을 붙이지 않는다)
      const ha = a.h / AMP_H, hx = a.l + AMP_TIP.x * ha, hy = a.t + AMP_TIP.y * ha, th = AMP_TIP.h * ha;
      taperLen = phone ? 10 : 30;
      const tx = hx + taperLen, xR = Math.max(xr, tx + (phone ? 4 : 18));
      const tp = document.createElementNS(NS, 'path');
      tp.setAttribute('d', `M${f(hx - 1)} ${f(hy - th / 2)} C${f(hx + taperLen * 0.45)} ${f(hy - th / 2)} ${f(hx + taperLen * 0.7)} ${f(hy - 1)} ${f(tx)} ${f(hy - 1)} L${f(tx)} ${f(hy + 1)} C${f(hx + taperLen * 0.7)} ${f(hy + 1)} ${f(hx + taperLen * 0.45)} ${f(hy + th / 2)} ${f(hx - 1)} ${f(hy + th / 2)} Z`);
      tp.setAttribute('class', s.threadTaper);

      const m = document.createElementNS(NS, 'path');
      el.appendChild(m);
      let d = `M${f(tx)} ${f(hy)} C${f(xR)} ${f(hy)} ${f(xR)} ${f(hy)} ${f(xR)} ${f(hy + Math.max(28, (xR - tx) * 1.6))}`;
      /** 지금까지 그린 선 길이 — 보조 획은 선이 이 길이까지 오면 보인다 */
      const here = () => { m.setAttribute('d', d); return m.getTotalLength(); };
      const addAux = (tag: 'path' | 'circle' | 'text', at: Record<string, string>, text?: string) => {
        const e = document.createElementNS(NS, tag);
        for (const [k, v] of Object.entries(at)) e.setAttribute(k, v);
        e.setAttribute('class', tag === 'text' ? s.threadLab : s.threadAux);
        if (text) e.textContent = text;
        aux.push({ el: e, len: here() });
      };

      // 찾기 — 02 머리 선 위 빈 줄로 왼쪽에 와서 머리글의 「불편한지」를 세로로 긴 고리로 감싼다
      const sh = rel(howSh), w = rel(find);
      const rx = w.w / 2 + 12, ry = w.h / 2 + 22, cx = w.l + w.w / 2, cy = w.t + w.h / 2, ex = cx + rx * 0.75, ey = cy - ry * 0.9;
      d += ` L${f(xR)} ${f(sh.t - 90)} C${f(xR)} ${f(sh.t - 40)} ${f(xR - 40)} ${f(sh.t - 36)} ${f(xR - 120)} ${f(sh.t - 36)}`;
      d += ` L${f(ex + 60)} ${f(sh.t - 36)} C${f(ex + 16)} ${f(sh.t - 36)} ${f(ex + 10)} ${f(ey - 36)} ${f(ex)} ${f(ey)}`;
      d += ` C${f(cx + rx * 0.1)} ${f(cy - ry * 1.25)} ${f(cx - rx * 1.2)} ${f(cy - ry * 1.1)} ${f(cx - rx)} ${f(cy)} C${f(cx - rx * 0.95)} ${f(cy + ry * 1.25)} ${f(cx + rx * 1.1)} ${f(cy + ry * 1.2)} ${f(cx + rx * 1.05)} ${f(cy + ry * 0.05)}`;

      // 짓기 — 설계와 개발을 감싸는 화면 틀을 직각으로(위 막대 포함). 폰은 오른쪽 길로 돌아가 오른쪽 위 모서리부터
      const b2 = rel(st2), fx0 = b2.l, fy0 = b2.t, fx1 = b2.r, fy1 = b2.b, bar = fy0 + 44;
      if (!phone) d += ` C${f(cx + rx * 1.1)} ${f(cy + ry * 2.2)} ${f(fx0)} ${f(fy0 - 70)} ${f(fx0)} ${f(fy0)} L${f(fx1)} ${f(fy0)} L${f(fx1)} ${f(fy1)} L${f(fx0)} ${f(fy1)} L${f(fx0)} ${f(fy0)} L${f(fx0)} ${f(bar)} L${f(fx1)} ${f(bar)} L${f(fx1)} ${f(fy1)} L${f(fx0)} ${f(fy1)}`;
      else d += ` C${f(cx + rx * 1.4)} ${f(cy + ry * 1.6)} ${f(gR)} ${f(cy)} ${f(gR)} ${f(cy + ry * 2.5)} L${f(gR)} ${f(fy0 - 30)} C${f(gR)} ${f(fy0)} ${f(gR)} ${f(fy0)} ${f(fx1)} ${f(fy0)} L${f(fx0)} ${f(fy0)} L${f(fx0)} ${f(fy1)} L${f(fx1)} ${f(fy1)} L${f(fx1)} ${f(fy0)} L${f(fx1)} ${f(bar)} L${f(fx0)} ${f(bar)} L${f(fx0)} ${f(fy1)}`;
      for (let i = 0; i < 3; i++) addAux('circle', { cx: f(fx0 + 18 + i * 14), cy: f(fy0 + 22), r: '3.5' });

      // 고치기 — 틀 왼쪽 선을 따라 내려와 「확인해서 고칩니다」 마지막 줄 밑을 긋고, 끝을 지나쳤다 되돌아오는 고리를 남긴 뒤 오른쪽 길로
      const rb = root.getBoundingClientRect(), lr = [...fix.getClientRects()].at(-1)!;
      const mr = lr.right - rb.left, uy = lr.bottom - rb.top + 3;
      d += ` L${f(fx0)} ${f(uy - 16)} C${f(fx0)} ${f(uy)} ${f(fx0)} ${f(uy)} ${f(fx0 + 16)} ${f(uy)} L${f(mr + 24)} ${f(uy)} C${f(mr + 40)} ${f(uy)} ${f(mr + 40)} ${f(uy + 18)} ${f(mr + 24)} ${f(uy + 18)} C${f(mr + 8)} ${f(uy + 18)} ${f(mr + 8)} ${f(uy)} ${f(mr + 30)} ${f(uy)} L${f(gR - 40)} ${f(uy)} C${f(gR)} ${f(uy)} ${f(gR)} ${f(uy)} ${f(gR)} ${f(uy + 40)}`;

      // 묶기 — 단계 아래 빈 줄로 왼쪽 여백에 건너가 서비스 두 묶음을 괄호로 묶는다(테두리가 아니라 분류)
      const r = rows.map(rel), gapY = (rel(st3).b + rel(canSh).t) / 2;
      const bx = phone ? CL - 9 : CL - 30, bn = phone ? 6 : 16;
      /** 보조 이름이 화면 왼쪽 8px 안에 들어오는지 — 들어오지 않으면 그 보조 획은 그리지 않는다 */
      const fits = (right: number, ts: string[]) => ts.every((t) => {
        const e = document.createElementNS(NS, 'text'); e.setAttribute('class', s.threadLab); e.textContent = t; el.appendChild(e);
        const wd = e.getComputedTextLength(); e.remove(); return right - wd >= 8;
      });
      const groupNames = [rows[0].getAttribute('data-group') ?? '', rows[2].getAttribute('data-group') ?? ''];
      const ways = ['전화', '메신저', '메일', '자리 방문'];
      const roomB = !phone && fits(bx - 18, groupNames), roomW = !phone && fits(bx - 62, ways);
      d += ` L${f(gR)} ${f(gapY - 40)} C${f(gR)} ${f(gapY)} ${f(gR)} ${f(gapY)} ${f(gR - 40)} ${f(gapY)} L${f(bx + 40)} ${f(gapY)} C${f(bx)} ${f(gapY)} ${f(bx)} ${f(gapY)} ${f(bx)} ${f(gapY + 40)}`;
      const brace = (t: number, b: number) => { const mid = (t + b) / 2; return ` L${f(bx)} ${f(t)} C${f(bx)} ${f(t + 30)} ${f(bx + bn)} ${f(t + 10)} ${f(bx + bn)} ${f(t + 34)} L${f(bx + bn)} ${f(mid - 18)} C${f(bx + bn)} ${f(mid - 4)} ${f(bx)} ${f(mid - 6)} ${f(bx - 8)} ${f(mid)} C${f(bx)} ${f(mid + 6)} ${f(bx + bn)} ${f(mid + 4)} ${f(bx + bn)} ${f(mid + 18)} L${f(bx + bn)} ${f(b - 34)} C${f(bx + bn)} ${f(b - 10)} ${f(bx)} ${f(b - 30)} ${f(bx)} ${f(b)}`; };
      for (const [t, b, name] of [[r[0].t + 6, r[1].b - 6, groupNames[0]], [r[2].t + 6, r[3].b - 6, groupNames[1]]] as const) {
        d += brace(t, b);
        if (roomB && name) addAux('text', { x: f(bx - 18), y: f((t + b) / 2 + 4), 'text-anchor': 'end' }, name);
      }

      // 들어가기 — 요청 처리: 전화·메신저·메일·자리 방문 네 갈래가 한 줄로 모여 화면 왼쪽으로 들어간다. 화면 안에서는 가려진다
      const pf = rel(pfh), jy = pf.t + pf.h * 0.55, jx = pf.l;
      d += ` L${f(bx)} ${f(jy - 100)} C${f(bx)} ${f(jy - 30)} ${f(jx - 30)} ${f(jy)} ${f(jx)} ${f(jy)}`;
      if (roomW) ways.forEach((t, i) => {
        const sy = pf.t + pf.h * 0.2 + i * pf.h * 0.16;
        addAux('path', { d: `M${f(bx - 56)} ${f(sy)} C${f(jx - 60)} ${f(sy)} ${f(jx - 50)} ${f(jy)} ${f(jx)} ${f(jy)}` });
        addAux('text', { x: f(bx - 62), y: f(sy + 4), 'text-anchor': 'end' }, t);
      });
      // 데스크톱은 그림 아래로(오른쪽은 글 칸), 폰은 그림 오른쪽 가장자리로
      const pOut = phone ? { x: pf.r, y: pf.t + pf.h * 0.75 } : { x: pf.l + pf.w * 0.62, y: pf.b };
      d += ` L${f(pf.l + pf.w * 0.4)} ${f(jy)} L${f(pOut.x)} ${f(pOut.y)}`;

      // 잇기 — 문제 은행: 위 빈 줄로 학습 홈에 들어가, 오른쪽으로 나와 풀이 화면으로
      const p1 = rel(pb1), p2 = rel(pb2), p1x = p1.l + p1.w / 2, yA = p2.t + p2.h * 0.55;
      if (phone) d += ` L${f(gR)} ${f(pOut.y)} L${f(gR)} ${f(p2.t - 60)} C${f(gR)} ${f(p2.t - 30)} ${f(p1x)} ${f(p2.t - 40)} ${f(p1x)} ${f(p1.t)}`;
      else d += ` C${f(pOut.x)} ${f(pOut.y + 120)} ${f(p1x)} ${f(p1.t - 140)} ${f(p1x)} ${f(p1.t)}`;
      d += ` L${f(p1x)} ${f(p1.t + p1.h * 0.36)} L${f(p1.r)} ${f(p1.t + p1.h * 0.36)} C${f(p1.r + 20)} ${f(p1.t + p1.h * 0.36)} ${f(p2.l - 20)} ${f(yA)} ${f(p2.l)} ${f(yA)} L${f(p2.r)} ${f(yA + 40)} C${f(gR)} ${f(yA + 40)} ${f(gR)} ${f(yA + 40)} ${f(gR)} ${f(yA + 100)}`;

      // 가르기 — 병원: 글과 비교 사이 빈 줄로 들어와 전·후 비교의 가운데로 지나간다(비교 안에서는 비교의 선이 그 자리를 잇는다)
      const hb = rel(hux), bxm = hb.l + hb.w * 0.5, hy0 = hb.t - 28;
      d += ` L${f(gR)} ${f(hy0 - 40)} C${f(gR)} ${f(hy0)} ${f(gR)} ${f(hy0)} ${f(gR - 40)} ${f(hy0)} L${f(bxm + 30)} ${f(hy0)} C${f(bxm)} ${f(hy0)} ${f(bxm)} ${f(hy0)} ${f(bxm)} ${f(hb.t)} L${f(bxm)} ${f(hb.b)}`;

      // 비교 오른쪽 아래 가장자리로 나와 오른쪽 길로(아래는 캡션, 위 오른쪽은 짚은 자리 글)
      d += ` L${f(hb.r)} ${f(hb.b - 16)} L${f(gR - 40)} ${f(hb.b - 16)} C${f(gR)} ${f(hb.b - 16)} ${f(gR)} ${f(hb.b - 16)} ${f(gR)} ${f(hb.b + 24)}`;

      // 짚기 — 교대 근무표: 전체 화면 뒤로 지나(가려짐) 아래 확대 그림으로 이어 준다. 전체 화면 캡션과 바꿔 보기 단추는 비켜 간다
      const sf = rel(shift), cr = rel(crop), btns = shift.closest('[data-two]')?.firstElementChild, cap = shift.parentElement?.querySelector('figcaption');
      let capR = sf.l;
      if (cap) { const rg = document.createRange(); rg.selectNodeContents(cap); for (const x of rg.getClientRects()) capR = Math.max(capR, x.right - rb.left); }
      const lx = Math.max(sf.l + sf.w * 0.2, capR + 28), down = lx <= Math.min(sf.r, cr.r) - 24;   // 캡션 오른쪽으로 곧장 내려갈 자리가 있는지
      if (down) {
        const ey2 = btns ? rel(btns).t - 20 : sf.t - 24;
        d += ` L${f(gR)} ${f(ey2 - 40)} C${f(gR)} ${f(ey2)} ${f(gR)} ${f(ey2)} ${f(gR - 40)} ${f(ey2)} L${f(lx + 30)} ${f(ey2)} C${f(lx)} ${f(ey2)} ${f(lx)} ${f(ey2)} ${f(lx)} ${f(ey2 + 30)} L${f(lx)} ${f(cr.b)}`;
      } else {
        // 폭이 좁으면 오른쪽에서 전체 화면으로 들어갔다 나와, 오른쪽 길로 확대 그림까지 내려가 옆으로 들어간다
        const y1 = sf.t + sf.h * 0.3, y2 = cr.t + cr.h * 0.5;
        d += ` L${f(gR)} ${f(y1 - 40)} C${f(gR)} ${f(y1)} ${f(gR)} ${f(y1)} ${f(gR - 40)} ${f(y1)} L${f(sf.l + sf.w * 0.3)} ${f(y1)} L${f(sf.r)} ${f(sf.b - 12)} L${f(gR - 40)} ${f(sf.b - 12)} C${f(gR)} ${f(sf.b - 12)} ${f(gR)} ${f(sf.b - 12)} ${f(gR)} ${f(sf.b + 28)} L${f(gR)} ${f(y2 - 40)} C${f(gR)} ${f(y2)} ${f(gR)} ${f(y2)} ${f(gR - 40)} ${f(y2)} L${f(cr.l + cr.w * 0.3)} ${f(y2)} L${f(cr.r)} ${f(cr.b - 6)}`;
      }

      // 입구 — 오른쪽 길로 내려와 마지막 & 의 같은 받침 획 끝으로, 오른쪽에서 가로로 들어간다
      const hc = c.h / AMP_H, fx = c.l + AMP_TIP.x * hc, fy = c.t + AMP_TIP.y * hc;
      const allEl = q(`.${s.all}`), yE = allEl ? (cr.b + rel(allEl).t) / 2 : cr.b + 60;   // 확대 그림과 「모든 작업」 줄 사이 빈 줄
      if (!down) d += ` L${f(xR - 40)} ${f(cr.b - 6)} C${f(xR)} ${f(cr.b - 6)} ${f(xR)} ${f(cr.b - 6)} ${f(xR)} ${f(cr.b + 34)}`;
      else d += ` L${f(lx)} ${f(yE - 30)} C${f(lx)} ${f(yE)} ${f(lx)} ${f(yE)} ${f(lx + 30)} ${f(yE)} L${f(xR - 40)} ${f(yE)} C${f(xR)} ${f(yE)} ${f(xR)} ${f(yE)} ${f(xR)} ${f(yE + 40)}`;
      d += ` L${f(xR)} ${f(fy - 44)} C${f(xR)} ${f(fy)} ${f(xR)} ${f(fy)} ${f(Math.max(fx, xR - 40))} ${f(fy)} L${f(fx)} ${f(fy)}`;
      L = here();

      // 스크롤 높이 ↔ 선 길이: 선 위 점의 높이를 따라가되(지나온 가장 낮은 곳) 가로로 가는 구간에도 조금씩 스크롤을 준다.
      // 들어가는 지점은 맨 끝에서 traceRun 만큼 앞 — 남은 스크롤로 & 를 그린다
      const traceRun = Math.min(360, vh * 0.4), end = Math.max(Math.min(fy, maxT - traceRun), hy);
      // 긴 선 전체에 getPointAtLength 를 수천 번 부르면 1초 넘게 멈춘다 — 명령 하나씩 짧은 path 로 재며 8px 마다 뽑는다
      anchors = [{ len: 0, y: hy - vh * 0.35 }];
      let at = 0, y = anchors[0].y, px = tx, py = hy;
      for (const cmd of d.match(/[LCQ][^MLCQ]*/g) ?? []) {
        m.setAttribute('d', `M${px} ${py} ${cmd}`);
        const n = cmd.slice(1).trim().split(/[\s,]+/).slice(-2).map(Number), sl = m.getTotalLength();
        for (let l = 8; l < sl; l += 8) { y = Math.max(y + 1.2, m.getPointAtLength(l).y); anchors.push({ len: at + l, y }); }
        at += sl; px = n[0]; py = n[1];
      }
      m.remove();
      anchors.push({ len: L, y: Math.max(anchors.at(-1)!.y + 1, end) });
      // 끝이 들어가야 할 높이를 넘으면 전체를 고르게 줄인다
      const y0 = anchors[0].y, last = anchors.at(-1)!.y;
      if (last > end && end > y0) for (const an of anchors) an.y = y0 + (an.y - y0) * (end - y0) / (last - y0);
      aIn = anchors.at(-1)!.y;

      // & 를 그리는 획: 선과 같은 화면 굵기(2px)가 되게 & 크기로 나눠 넣고, 점선 길이는 실제 획 길이로
      traceLen = trace?.getTotalLength() ?? 0;
      if (trace) { trace.style.strokeWidth = f(2 / (c.h / AMP_H)); trace.style.strokeDasharray = `${f(traceLen)} ${f(traceLen + 10)}`; }

      // 실제 화면 그림 안에서는 선이 가려진다(그림 뒤로 지나간다). 남색 문의 장 안에서는 밝은 선
      const under = [...root.querySelectorAll('[data-under]')].map(rel).filter((u) => u.w > 0);
      el.insertAdjacentHTML('afterbegin', `<defs><mask id="thread-under" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/>${under.map((u) => `<rect x="${f(u.l)}" y="${f(u.t)}" width="${f(u.w)}" height="${f(u.h)}" fill="#000"/>`).join('')}</mask><clipPath id="thread-dark"><rect x="0" y="${f(sec.t)}" width="${W}" height="${f(H - sec.t)}"/></clipPath></defs>`);
      el.appendChild(tp);
      const mk = (cls: string, clip?: boolean) => {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', d); p.setAttribute('class', cls); p.setAttribute('mask', 'url(#thread-under)');
        if (clip) p.setAttribute('clip-path', 'url(#thread-dark)');
        el.appendChild(p); return p;
      };
      ink = mk(s.threadInk); light = mk(`${s.threadInk} ${s.threadLight}`, true);
      for (const x of aux) el.appendChild(x.el);   // 순서: 시작 획 · 선 · 밝은 선 · 보조 획
      tip = document.createElementNS(NS, 'circle'); tip.setAttribute('r', '4.5'); tip.setAttribute('class', s.threadTip); el.appendChild(tip);
      taper = tp;
      yS = -1;
      paint(reduced ? Infinity : scrollY - top + vh * 0.62);
    };

    /** y: 선 끝이 따라갈 높이(부드럽게 따라간 값) */
    const paint = (y: number) => {
      if (!ink || !light || !tip || !taper) return;
      const drawn = reduced ? L : lenAt(y);
      for (const p of [ink, light]) p.style.strokeDasharray = `${f(drawn)} ${f(L + 40)}`;
      taper.toggleAttribute('data-on', drawn > 1);
      for (const x of aux) x.el.toggleAttribute('data-on', drawn >= x.len - 1);
      // & 그리기: 받침 획 끝에 닿은 뒤 남은 스크롤이 획을 그리고, 다 그리면 채운다
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
