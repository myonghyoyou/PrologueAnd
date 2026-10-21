import { test, expect } from '@playwright/test';

/** PDF 저장 — 답을 많이 해도 A4 한 쪽에 들어와야 한다(사용자 요청 2026-10-21) */
const RICH = { v: 1, mode: 'renew', renewUrl: 'example.com', renewPain: '모바일에서 글자가 너무 작고 예약 버튼을 찾기 어려워요', renewAmount: '보통',
  kind: '가게(식당·카페 등)', name: '봄날 베이커리', goalMain: '찾아오기', goalMore: ['예약하기', '소식 보기'], audience: ['처음 오는 고객', '단골'],
  pages: ['소개', '메뉴·서비스', '가격', '오시는 길', '소식'], pagesExtra: '단체 주문', features: { '문의 남기기': 'must', '예약 받기': 'must', '외국어 페이지': 'later' },
  featuresExtra: '쿠폰 발급', booking: '네이버 예약 연결', langs: ['영어'], links: ['네이버 플레이스·예약', '인스타그램'], copy: '써 주길 원함', photo: '없어요',
  brand: ['로고 원본 파일'], design: '새 디자인을 맞춤으로 만들어 주세요', refs: [{ url: 'https://example.org', likes: ['색·분위기', '배치'], memo: '사진이 크게 나오는 게 좋아요' }],
  dislikes: '너무 화려한 움직임', ops: ['공지·소식', '메뉴·가격'], revisions: '3번(보통)', care: '필요할 때만', openDate: '2026-11-10', openFixed: '해당 날짜에 꼭 오픈해주세요',
  budget: '300~800만 원', budgetInBrief: true, decider: '나 혼자' };
const MIN = { v: 1, mode: 'new', kind: '회사·사무실', goalMain: '문의 남기기' };
const L = (n: number) => '모바일에서 글자가 작고 예약 단추를 찾기 어려워요. '.repeat(n).slice(0, 300);
/** 거의 모든 칸을 채우고 긴 글(300자)까지 넣은 경우 */
const MAX = { ...RICH, renewPain: L(10), renewAmount: '많아요(100개 넘음)', goalMore: ['전화하기', '문의 남기기', '상품 사기', '소식 보기'], audience: ['처음 오는 고객', '단골', '거래처·기업', '외국인'],
  pages: ['소개', '메뉴·서비스', '가격', '오시는 길', '소식', '사진·포트폴리오', '후기', '자주 묻는 질문', '문의', '채용'], pagesExtra: '단체 주문, 이벤트, 제휴',
  features: { '문의 남기기': 'must', '예약 받기': 'must', '상품 결제': 'must', '회원': 'later', '외국어 페이지': 'later', '직접 글 올리기(공지·소식)': 'must', '카카오 채널 연결': 'must' },
  featuresExtra: '쿠폰 발급, 대기 번호 안내, 포인트 적립', booking: '홈페이지 안에서 직접', shopCount: '50개 이하', shopHow: '홈페이지에서 직접 결제', member: '카카오로 로그인', langs: ['영어', '중국어', '일본어'],
  links: ['네이버 플레이스·예약', '카카오 채널', '인스타그램', '스마트스토어', '배달앱'], contentBy: '2026-11-01', brand: ['로고 원본 파일', '정해진 색·글꼴', '명함·전단 같은 인쇄물'],
  refs: [1, 2, 3].map((i) => ({ url: `https://example${i}.org/some/page`, likes: ['색·분위기', '배치', '글·사진'], memo: '사진이 크게 나오고 글이 짧은 점이 좋아요' })),
  dislikes: L(10), ops: ['공지·소식', '사진', '메뉴·가격'], revisions: '5번', care: '매달 맡기기', budget: '800만 원 이상', decider: '여럿이 같이' };
/** 그 사이 — 긴 글 없이 칸만 많이 채운 경우 */
const MID = { ...MAX, renewPain: '모바일에서 글자가 작아요', dislikes: '화려한 움직임', refs: MAX.refs.slice(0, 2) };

for (const [name, answers] of [['많이 답한 요청서', RICH], ['필수 둘만 답한 요청서', MIN], ['거의 모든 칸 + 긴 글', MAX], ['칸을 많이 채운 요청서', MID]] as const) {
  test(`PDF 한 쪽 — ${name}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'w1440');   // PDF 는 화면 크기와 무관 — 한 번만
    await page.goto('/tools/brief');
    await expect(page.locator('[data-brief] h1')).toBeVisible();
    await page.evaluate((a) => localStorage.setItem('prologue.brief.v1', JSON.stringify({ answers: a, step: 'when', done: true })), answers);
    await page.reload();
    await expect(page.locator('[data-brief-doc]')).toBeVisible();
    await page.emulateMedia({ media: 'print' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
    expect(pages).toBe(1);
  });
}
