'use client';
import { useMemo } from 'react';
import { sampleAnswers } from '@/content/brief/sample';
import { buildBrief } from '@/lib/brief/derive';
import s from './intro.module.css';
import { Num, ui } from '@/components/ui/controls';
import { useCopy } from './copy-context';

/** 견본 종이 — 본문과 다른 흰 종이에 「견본」 도장, 앞 단원 세 개만 보이고 아래는 잘려서 「더 있다」를 보여 준다.
 *  쪽수는 답에 따라 달라서 적지 않는다 */
function SamplePaper() {
  const c = useCopy();
  const b = useMemo(() => buildBrief(sampleAnswers(c), new Date(), c), [c]);
  const secs = b.sections.filter((x) => x.rows.length && x.id !== 'unknown').slice(0, 3);
  return (
    <>
      <div className={s.paper} data-paper>
        <div className={s.ph}>
          <div><p className={s.pt}>{b.title}</p><p className={s.pm}>{b.subtitle}</p></div>
          <span className={s.stamp} data-stamp>{c.intro.stamp}</span>
        </div>
        {secs.map((x, i) => (
          <div key={x.id} className={s.sec}>
            <Num n={i + 1} className={s.sn} />
            <div>
              <p className={s.st}>{x.title}</p>
              <dl className={s.dl}>{x.rows.map((r, k) => (
                <div key={k} className={s.row}><dt>{r.label}</dt><dd>
                  {r.tag === 'must' ? <span className={s.tag}>{c.doc.tags.must}</span> : r.tag === 'later' ? <span className={`${s.tag} ${s.later}`}>{c.doc.tags.later}</span> : null}{r.value}
                </dd></div>
              ))}</dl>
            </div>
          </div>
        ))}
      </div>
      <div className={s.cut} data-cut aria-hidden="true" />
      <p className={s.rest}>{c.intro.rest}</p>
    </>
  );
}

/** 시작 화면 — 부담 없이 시작하게: 걸리는 시간, 연락처를 묻지 않음, 저장 위치, 중립, 결과 견본(명세 §11) */
export function Intro({ onStart }: { onStart: () => void }) {
  const c = useCopy();
  return (
    <section className={s.intro} data-brief-intro>
      <h1 className={s.h}>{c.intro.title}</h1>
      <p className={s.lead}>{c.intro.lead}</p>
      <ul className={s.promise} data-brief-promise>
        {c.intro.promises.map((p) => <li key={p}>{p}</li>)}
      </ul>
      <p className={s.neutral}>{c.intro.neutral}</p>
      <button type="button" className={`${ui.btn} ${ui.pri} ${s.start}`} onClick={onStart} data-brief-start>{c.intro.start}</button>
      <figure className={s.sample} data-brief-sample>
        <figcaption className={s.cap}>{c.intro.sampleCaption}</figcaption>
        <SamplePaper />
      </figure>
    </section>
  );
}
