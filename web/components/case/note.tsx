'use client';
import { useState, type ReactNode } from 'react';
import type { NoteBlock } from '@/content';
import { Row } from './row';
import { SpotList, SpotOverlay } from './hotspots';
import g from './grid.module.css';
import t from './type.module.css';
import s from './note.module.css';

/** 여백 주석 글: 라벨(앞부분 굵게, " · " 뒤는 흐리게) · 제목 · 문단. 폰 칸(phones.tsx)도 쓴다 */
export function NoteText({ label, h, p, children }: { label?: string; h?: string; p?: string[]; children?: ReactNode }) {
  const [head, ...rest] = (label ?? '').split(' · ');
  return (
    <>
      {label ? <div className={t.lab}>{head}{rest.length ? <i> · {rest.join(' · ')}</i> : null}</div> : null}
      {h ? <h3 className={t.h3} dangerouslySetInnerHTML={{ __html: h }} /> : null}
      {p?.map((x, i) => <p key={i} className={t.p}>{x}</p>)}
      {children}
    </>
  );
}

export function Note({ b }: { b: NoteBlock }) {
  const [spot, setSpot] = useState(-1);
  const spots = b.figs[0].spots ?? [];
  return (
    <div className={g.g}>
      <div className={`${g.noteText} ${s.text}`} data-note-text>
        <NoteText label={b.label} h={b.h} p={b.p}>
          {spots.length ? <SpotList spots={spots} active={spot} onHover={setSpot} /> : null}
        </NoteText>
      </div>
      <div className={`${g.noteFigs} ${s.figs}`}>
        <Row figs={b.figs} sizes="(max-width:1023px) 100vw, 1230px"
             overlay={spots.length ? <SpotOverlay spots={spots} active={spot} /> : undefined} />
      </div>
    </div>
  );
}
