'use client';
import { useEffect, useRef, useState } from 'react';
import type { Spot } from '@/content';
import { PIN, usePin } from './pinned';
import { Was } from './was';
import g from './grid.module.css';
import t from './type.module.css';
import hs from './hotspots.module.css';
import s from './request-form-demo.module.css';

/** 스크롤 진행률: 블록 트랙 윗변이 PIN 에 오면 0, 2.4 화면 높이 더 내려가면 1(트랙 room 280vh 의 나머지는 완성 상태로 붙잡음) */
const STEPS = 2.4;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (k: number) => 1 - Math.pow(1 - k, 3);

// 화면 속 값 — data/images/captures/pfh/README.md 의 form.png 가상 데이터와 같다
const T = {
  title: "거래처 단가표 양식에 '적용 시작일' 열 추가",
  screen: '거래처 단가표',
  body: '분기마다 단가가 바뀌는데 현재 양식에는 시작일이 없어 거래처가 옛 단가로 발주하는 일이 반복됩니다. 3분기에만 4건.',
};
const CPS = 20;   // 타이핑 초당 글자 수

type Ev = { at: number; kind: 'chip' | 'type' | 'attach' | 'button'; k: string; dur: number; text?: string; click?: boolean };
/** at = 스크롤 진행률 문턱. 넘으면 dur 초 동안 앞으로 재생, 되돌아오면 두 배 빠르게 되감는다 */
const EV: Ev[] = [
  { at: 0.04, kind: 'chip', k: 'type', dur: 0.3, click: true },
  { at: 0.12, kind: 'type', k: 'title', text: T.title, dur: T.title.length / CPS },
  { at: 0.38, kind: 'chip', k: 'when', dur: 0.3, click: true },
  { at: 0.44, kind: 'type', k: 'screen', text: T.screen, dur: T.screen.length / CPS },
  { at: 0.53, kind: 'type', k: 'body', text: T.body, dur: T.body.length / (CPS * 2.4) },
  { at: 0.70, kind: 'attach', k: 'a1', dur: 0.9 },
  { at: 0.78, kind: 'attach', k: 'a2', dur: 0.9 },
  { at: 0.91, kind: 'button', k: 'send', dur: 0.7 },
];

const FileIcon = () => (
  <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden><path d="M3 1.5h6.5L13 5v11.5H3z" fill="#F1ECF8" stroke="#B9A6D6" strokeWidth="1.2" strokeLinejoin="round" /><path d="M9.5 1.5V5H13" fill="none" stroke="#B9A6D6" strokeWidth="1.2" strokeLinejoin="round" /><path d="M5.5 9h5M5.5 11.5h5M5.5 14h3" stroke="#B9A6D6" strokeWidth="1.2" strokeLinecap="round" /></svg>
);
const ClipIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden><path d="M11 4.5 5.9 9.6a1.6 1.6 0 0 0 2.3 2.3l5-5a3 3 0 0 0-4.2-4.2L3.8 7.9a4.2 4.2 0 0 0 5.9 5.9l3.2-3.2" fill="none" stroke="#5C6372" strokeWidth="1.4" strokeLinecap="round" /></svg>
);
const Cursor = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden><path d="M5 3l13 7.2-5.6 1.5 3.3 6.3-2.6 1.3-3.3-6.3L5 17z" fill="#1C1B18" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" /></svg>
);

/** 칩 하나(캡처 CSS 좌표) */
const Chip = ({ x, w, y, k, children }: { x: number; w: number; y: number; k?: string; children: React.ReactNode }) => (
  <div className={s.chip} data-k={k} data-y={y} style={{ left: x, top: y, width: w }}>{children}</div>
);

/**
 * 요청 양식이 스크롤에 맞춰 채워진다(데스크톱). 지금 채우는 구역만 선명하고 나머지는 옅어진다(초점).
 * 겹쳐 그리는 네모·선은 쓰지 않는다(2026-09-28 사용자 결정, 비교 시트 D2). 왼쪽 설명 ①②③ 이 함께 켜진다.
 * 구역은 spots(캡처 기준 %) 와 같다: ① 유형·제목 ② 언제까지·화면·내용 ③ 첨부
 */
export function RequestFormDemo({ was, h, spots, alt, caption }: { was?: string; h?: string; spots: Spot[]; alt: string; caption?: string }) {
  const pin = usePin();
  const pic = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(-1);

  useEffect(() => {
    const P = pic.current, F = form.current, track = pin?.ref.current;
    if (!P || !F || !track || !pin?.on) return;
    const q = (k: string) => F.querySelector<HTMLElement>(`[data-k="${k}"]`)!;
    const evs = EV.map((e) => ({ ...e, v: 0, node: q(e.k), was: false }));
    // 구역 나누기(캡처 CSS 좌표의 top): 0 유형·제목 / 1 언제까지·화면·내용 / 2 첨부 / 나머지
    const group = new Map<HTMLElement, number | 'other'>();
    [...F.children].forEach((n) => {
      const el = n as HTMLElement;
      if (el.dataset.skip !== undefined) return;
      const y = Number(el.dataset.y ?? -1);
      group.set(el, y >= 210 && y < 385 ? 0 : y >= 385 && y < 720 ? 1 : y >= 720 && y < 915 ? 2 : 'other');
    });
    const cur = { x: 1180, y: 1040 };
    const curEl = q('cursor');
    let last = 0, raf = 0, shown = -2;

    const fit = () => { F.style.transform = `scale(${P.clientWidth / 1280})`; };
    const prog = () => clamp((PIN - track.getBoundingClientRect().top) / (innerHeight * STEPS));
    const esc = (x: string) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const ring = (x: number, y: number) => {
      const r = document.createElement('i'); r.className = s.ring; r.style.left = `${x}px`; r.style.top = `${y}px`;
      F.appendChild(r); setTimeout(() => r.remove(), 600);
    };
    const aim = (e: (typeof evs)[number]) => {
      const n = e.node;
      if (e.kind === 'type') {
        if (e.k === 'body') return { x: n.offsetLeft + 40, y: n.offsetTop + 44 };
        const c = Math.round((e.text?.length ?? 0) * e.v);
        return { x: n.offsetLeft + 22 + Math.min(n.offsetWidth - 44, c * 13), y: n.offsetTop + n.offsetHeight / 2 + 12 };
      }
      if (e.kind === 'attach') return { x: n.offsetLeft + 60, y: n.offsetTop + 30 };
      return { x: n.offsetLeft + n.offsetWidth / 2, y: n.offsetTop + n.offsetHeight / 2 + 4 };
    };

    const frame = (ts: number) => {
      const dt = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts;
      const tt = prog();
      let lead: (typeof evs)[number] | null = null;
      for (const e of evs) {
        const on = tt >= e.at;
        const d = dt / e.dur * (on ? 1 : 2);
        e.v = on ? Math.min(1, e.v + d) : Math.max(0, e.v - d);
        if (on) lead = e;
        const n = e.node;
        if (e.kind === 'chip') {
          const sel = e.v > 0.35;
          if (sel && !e.was && on && e.click) { const a = aim(e); ring(a.x, a.y - 4); }
          n.classList.toggle(s.on, sel); e.was = sel;
        } else if (e.kind === 'type') {
          const text = e.text ?? '', c = Math.round(text.length * e.v), typing = e.v > 0 && e.v < 1;
          const html = esc(text.slice(0, c)) + (typing ? `<span class="${s.caret}"></span>` : '');
          if (n.innerHTML !== html) n.innerHTML = html;
          n.classList.toggle(s.typing, typing);
        } else if (e.kind === 'attach') {
          const inn = ease(Math.min(1, e.v / 0.3));
          n.style.opacity = String(inn);
          n.style.transform = `translateX(${(1 - inn) * -18}px)`;
          const up = n.querySelector<HTMLElement>('[data-up]')!;
          up.style.width = `${clamp((e.v - 0.25) / 0.6) * 100}%`;
          up.style.opacity = e.v >= 0.98 ? '0' : '1';
        } else {
          n.querySelector<HTMLElement>('[data-fill]')!.style.width = `${ease(e.v) * 100}%`;
        }
      }
      // 커서: 마지막으로 시작된 동작의 대상에게로 감속 이동
      const want = lead ? aim(lead) : { x: 1180, y: 1040 };
      const f = 1 - Math.exp(-dt * 9);
      cur.x += (want.x - cur.x) * f; cur.y += (want.y - cur.y) * f;
      curEl.style.transform = `translate(${cur.x - 5}px, ${cur.y - 3}px)`;
      curEl.style.opacity = tt > 0.02 && tt < 0.99 ? '1' : '0';
      // 초점: 지금 구역 + 지금 움직이는 요소만 선명
      const si = tt < 0.33 ? 0 : tt < 0.66 ? 1 : 2;
      const busy = lead && lead.v < 1 ? lead.node : null;
      group.forEach((gp, n) => {
        const on = tt <= 0.01 || gp === si || n === busy || (n.dataset.k === 'send' && tt >= 0.91);
        n.style.filter = on ? '' : 'opacity(.32)';
      });
      const now = tt > 0.01 ? si : -1;
      if (now !== shown) { shown = now; setStep(now); }
      raf = requestAnimationFrame(frame);
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(P);
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [pin, spots]);

  return (
    <div className={g.g}>
      <div className={g.noteText} data-note-text>
        <Was text={was} />
        {h ? <h3 className={t.h3} dangerouslySetInnerHTML={{ __html: h }} /> : null}
        <ul className={hs.spots}>
          {spots.map((sp, i) => (
            <li key={i} data-demo-spot={i} className={step === i ? hs.on : undefined}><b>{i + 1}</b><span>{sp.cap}</span></li>
          ))}
        </ul>
      </div>
      <div className={g.noteFigs}>
        <figure className={s.frame} data-form-demo style={{ margin: 0 }}>
          <div ref={pic} className={s.pic}>
            <div ref={form} className={s.form} aria-hidden>
              <div className={s.card} data-skip />
              <div className={`${s.t} ${s.h}`} data-y={48} style={{ left: 196, top: 48 }}>업무 요청하기</div>
              <div className={`${s.t} ${s.sub}`} data-y={85} style={{ left: 196, top: 85 }}>요청을 남기시면 언제까지 처리되는지 알려드립니다. 전화 안 주셔도 됩니다.</div>
              <div className={`${s.t} ${s.lb}`} data-y={127} style={{ left: 196, top: 127 }}>어느 시스템인가요</div>
              <Chip x={196} w={71} y={158}>업무포털</Chip>
              <div className={`${s.t} ${s.lb}`} data-y={214} style={{ left: 196, top: 214 }}>어떤 요청인가요</div>
              <Chip x={196} w={49} y={245}>오류</Chip><Chip x={253} w={71} y={245} k="type">기능수정</Chip><Chip x={332} w={70} y={245}>신규개발</Chip>
              <Chip x={409} w={60} y={245}>보고서</Chip><Chip x={476} w={83} y={245}>데이터조회</Chip><Chip x={566} w={82} y={245}>데이터수정</Chip>
              <Chip x={655} w={70} y={245}>권한계정</Chip><Chip x={733} w={49} y={245}>문의</Chip>
              <div className={`${s.t} ${s.lb}`} data-y={301} style={{ left: 196, top: 301 }}>제목</div>
              <div className={s.field} data-k="title" data-y={331} style={{ top: 331, height: 40 }} />
              <div className={`${s.t} ${s.lb}`} data-y={391} style={{ left: 196, top: 391 }}>언제까지 필요하세요</div>
              <Chip x={196} w={49} y={422}>오늘</Chip><Chip x={253} w={63} y={422} k="when">이번 주</Chip><Chip x={323} w={64} y={422}>다음 주</Chip><Chip x={394} w={85} y={422}>급하지 않음</Chip>
              <div className={`${s.t} ${s.lb}`} data-y={478} style={{ left: 196, top: 478 }}>어느 화면인가요<i>선택</i></div>
              <div className={s.field} data-k="screen" data-y={509} style={{ top: 509, height: 40 }} />
              <div className={`${s.t} ${s.lb}`} data-y={568} style={{ left: 196, top: 568 }}>내용<i>선택</i></div>
              <div className={`${s.field} ${s.area}`} data-k="body" data-y={598} style={{ top: 598, height: 107 }} />
              <div className={`${s.t} ${s.lb}`} data-y={726} style={{ left: 196, top: 726 }}>파일 첨부<i>선택 · 3개까지 · 개당 5MB · 이미지 · PDF · HTML</i></div>
              <div className={s.att} data-k="a1" data-y={756} style={{ top: 756 }}><span className={s.ic}><FileIcon /></span>단가표_2026Q3.pdf<span className={s.x}>×</span><i className={s.up} data-up /></div>
              <div className={s.att} data-k="a2" data-y={812} style={{ top: 812 }}><span className={`${s.ic} ${s.blank}`} />현재양식_캡처.png<span className={s.x}>×</span><i className={s.up} data-up /></div>
              <Chip x={196} w={71} y={879}><ClipIcon />1개 더</Chip>
              <div className={`${s.t} ${s.note}`} data-y={933} style={{ left: 196, top: 933 }}>※ 고객 개인정보·연락처는 관리번호로 적어주세요.</div>
              <div className={s.btn} data-k="send" data-y={970}><i className={s.fill} data-fill /><span>요청하기</span></div>
              <div className={s.cur} data-k="cursor" data-skip><Cursor /></div>
            </div>
          </div>
          <span className={s.sr}>{alt}</span>
        </figure>
        {caption ? <p className={s.cap}>{caption}</p> : null}
      </div>
    </div>
  );
}
