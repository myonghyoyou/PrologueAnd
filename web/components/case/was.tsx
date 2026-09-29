import t from './type.module.css';

/** 이 화면이 없던 때의 모습 한 줄 — 여백 주석 제목 위에 "전에는"으로 붙어 개선을 비교할 기준이 된다 */
export function Was({ text }: { text?: string }) {
  return text ? <p className={t.was} data-was><b>전에는</b>{text}</p> : null;
}
