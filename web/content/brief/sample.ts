import { emptyAnswers } from '@/lib/brief/storage';
import type { Answers } from '@/lib/brief/types';

/** 시작 화면 견본 — 가상의 가게 */
export const SAMPLE: Answers = {
  ...emptyAnswers(), mode: 'new', kind: '가게(식당·카페 등)', name: '봄날 베이커리', goalMain: '찾아오기', goalMore: ['예약하기'],
  audience: ['처음 오는 손님', '단골'], pages: ['소개', '메뉴·서비스', '오시는 길', '소식'],
  features: { '예약 받기': 'must', '직접 글 올리기(공지·소식)': 'later' }, booking: '네이버 예약 연결',
};
