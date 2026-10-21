'use client';
import { useMemo } from 'react';
import { SAMPLE } from '@/content/brief/sample';
import { buildBrief } from '@/lib/brief/derive';
import s from './intro.module.css';
import { Num, ui } from '@/components/ui/controls';

/** 견본 종이 — 본문과 다른 흰 종이에 「견본」 도장, 앞 단원 세 개만 보이고 아래는 잘려서 「더 있다」를 보여 준다.
 *  쪽수는 답에 따라 달라서 적지 않는다 */
function SamplePaper() {
  const b = useMemo(() => buildBrief(SAMPLE, new Date()), []);
  const secs = b.sections.filter((x) => x.rows.length && x.id !== 'unknown').slice(0, 3);
  return (
    <>
      <div className={s.paper} data-paper>
        <div className={s.ph}>
          <div><p className={s.pt}>{b.title}</p><p className={s.pm}>{b.subtitle}</p></div>
          <span className={s.stamp} data-stamp>견본</span>
        </div>
        {secs.map((x, i) => (
          <div key={x.id} className={s.sec}>
            <Num n={i + 1} className={s.sn} />
            <div>
              <p className={s.st}>{x.title}</p>
              <dl className={s.dl}>{x.rows.map((r, k) => (
                <div key={k} className={s.row}><dt>{r.label}</dt><dd>
                  {r.tag === 'must' ? <span className={s.tag}>오픈 때 필수</span> : r.tag === 'later' ? <span className={`${s.tag} ${s.later}`}>나중에</span> : null}{r.value}
                </dd></div>
              ))}</dl>
            </div>
          </div>
        ))}
      </div>
      <div className={s.cut} data-cut aria-hidden="true" />
      <p className={s.rest}>이하 생략 · 일정·예산·업체에 물어볼 질문까지 이어져요</p>
    </>
  );
}

/** 시작 화면 — 부담 없이 시작하게: 걸리는 시간, 연락처를 묻지 않음, 저장 위치, 중립, 결과 견본(명세 §11) */
export function Intro({ onStart }: { onStart: () => void }) {
  return (
    <section className={s.intro} data-brief-intro>
      <h1 className={s.h}>홈페이지 요청서 만들기</h1>
      <p className={s.lead}>질문에 답하면 어느 업체에나 보낼 수 있는 요청서가 만들어져요. 업체마다 다르게 오는 견적을 같은 기준으로 비교할 수 있어요.</p>
      <ul className={s.promise} data-brief-promise>
        <li>5분 안팎</li>
        <li>가입·연락처 없이</li>
        <li>답은 이 기기에만 저장</li>
      </ul>
      <p className={s.neutral}>특정 업체를 추천하거나 연결하지 않아요.</p>
      <button type="button" className={`${ui.btn} ${ui.pri} ${s.start}`} onClick={onStart} data-brief-start>시작하기</button>
      <figure className={s.sample} data-brief-sample>
        <figcaption className={s.cap}>이런 요청서가 만들어져요 · 가상의 가게</figcaption>
        <SamplePaper />
      </figure>
    </section>
  );
}
