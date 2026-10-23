// 서버·클라이언트 어디서든 읽는 순수 글자 — CSS·React 를 끌어오지 않는다(문구 파일이 값으로 가져다 쓴다)
const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 달력에 보이는 글자 — 언어별로 바꿔 끼운다(기본은 한국어) */
export type DateFieldText = { locale: 'ko' | 'en'; empty: string; none: string; prev: string; next: string; show: (d: Date) => string; title: (d: Date) => string };
export const DATE_KO: DateFieldText = {
  locale: 'ko', empty: '날짜를 골라 주세요', none: '고르지 않음', prev: '이전 달', next: '다음 달',
  show: (d) => `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${DAYS[d.getDay()]})`,
  title: (d) => `${d.getFullYear()}년 ${d.getMonth() + 1}월`,
};
/** 영어 — 숫자만 쓴 날짜는 나라마다 순서가 달라 글자로 쓴 달(명세 3-4) */
export const DATE_EN: DateFieldText = {
  locale: 'en', empty: 'Pick a date', none: 'not set', prev: 'Previous month', next: 'Next month',
  show: (d) => new Intl.DateTimeFormat('en', { dateStyle: 'full' }).format(d),
  title: (d) => new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(d),
};
