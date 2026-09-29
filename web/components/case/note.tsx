'use client';
import { useState, type ReactNode } from 'react';
import type { NoteBlock } from '@/content';
import { Frame } from './frame';
import { Row } from './row';
import { Was } from './was';
import { SpotList, SpotOverlay } from './hotspots';
import { Pinned } from './pinned';
import { RequestFormDemo } from './request-form-demo';
import demo from './request-form-demo.module.css';
import g from './grid.module.css';
import t from './type.module.css';
import s from './note.module.css';

/** 여백 주석 글: 라벨(앞부분 굵게, " · " 뒤는 흐리게) · 전에는 · 제목 · 문단. 폰 칸(phones.tsx)도 쓴다 */
export function NoteText({ label, was, h, p, children }: { label?: string; was?: string; h?: string; p?: string[]; children?: ReactNode }) {
  const [head, ...rest] = (label ?? '').split(' · ');
  return (
    <>
      {label ? <div className={t.lab}>{head}{rest.length ? <i> · {rest.join(' · ')}</i> : null}</div> : null}
      <Was text={was} />
      {h ? <h3 className={t.h3} dangerouslySetInnerHTML={{ __html: h }} /> : null}
      {p?.map((x, i) => <p key={i} className={t.p}>{x}</p>)}
      {children}
    </>
  );
}

export function Note({ b }: { b: NoteBlock }) {
  // 재현 화면이 있는 주석: 데스크톱은 붙어서 스크롤로 채워지는 판, 폰·모션 줄이기는 아래의 캡처 + 핫스팟
  if (b.play === 'pfh-request-form') {
    const f = b.figs[0];
    return (
      <Pinned room={280}>
        <div className={demo.live} data-note-live>
          <RequestFormDemo was={b.was} h={b.h} spots={f.spots ?? []} alt={f.alt} caption={f.caption} />
        </div>
        <div className={demo.still}><NoteStill b={b} /></div>
      </Pinned>
    );
  }
  return <NoteStill b={b} />;
}

function NoteStill({ b }: { b: NoteBlock }) {
  const [spot, setSpot] = useState(-1);
  const [side, setSide] = useState<'after' | 'before'>('after');
  const spots = b.figs[0].spots ?? [];
  const showSpots = spots.length > 0 && side === 'after';
  // 바꿀 때마다 가리키던 핫스팟을 놓는다 — 전에서는 강조가 없고, 후로 돌아와도 강조 없이 시작한다
  const flip = (to: 'after' | 'before') => { setSpot(-1); setSide(to); };
  return (
    <div className={g.g}>
      <div className={`${g.noteText} ${s.text}`} data-note-text>
        <NoteText label={b.label} was={b.was} h={b.h} p={b.p}>
          {showSpots ? <SpotList spots={spots} active={spot} onHover={setSpot} /> : null}
        </NoteText>
      </div>
      <div className={`${g.noteFigs} ${s.figs}`}>
        {b.beforeFig ? (
          <div className={s.toggle} role="group" aria-label="캡처 전후" data-side-toggle>
            <button type="button" data-side="after" aria-pressed={side === 'after'} onClick={() => flip('after')}>후</button>
            <button type="button" data-side="before" aria-pressed={side === 'before'} onClick={() => flip('before')}>전</button>
          </div>
        ) : null}
        <div className={s.swap} data-swap data-side={side}>
          <div aria-hidden={side === 'before' ? true : undefined}>
            <Row figs={b.figs} sizes="(max-width:1023px) 100vw, 1230px"
                 overlay={showSpots ? <SpotOverlay spots={spots} active={spot} /> : undefined} />
          </div>
          {b.beforeFig ? (
            <div className={s.before} data-before aria-hidden={side === 'before' ? undefined : true}>
              <Frame fig={b.beforeFig} sizes="(max-width:1023px) 100vw, 1230px" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
