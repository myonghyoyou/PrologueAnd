'use client';
import { SAMPLE } from '@/content/brief/sample';
import { BriefPreview } from './preview';
import s from './intro.module.css';

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
      <button type="button" className={s.start} onClick={onStart} data-brief-start>시작하기</button>
      <figure className={s.sample} data-brief-sample>
        <figcaption className={s.cap}>이런 요청서가 만들어져요 · 가상의 가게 견본</figcaption>
        <BriefPreview a={SAMPLE} limit={3} />
      </figure>
    </section>
  );
}
