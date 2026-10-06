import type { Metadata, Viewport } from 'next';
import { Bodoni_Moda } from 'next/font/google';
import localFont from 'next/font/local';
import { LenisProvider } from '@/components/lenis-provider';
import { InquiryDrawer } from '@/components/inquiry-drawer';
import { RouteCommit } from '@/components/route-commit';
import { ZoomViewer } from '@/components/zoom-viewer';
import { SITE, NAME, NAME_KO, TAGLINE, shouldIndex } from '@/lib/site';
import './globals.css';

const serif = Bodoni_Moda({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-serif', display: 'swap' });
const sans = localFont({
  src: [{ path: '../public/fonts/PretendardVariable.woff2', weight: '45 920', style: 'normal' }],
  variable: '--font-sans', display: 'swap',
});


/** 아이폰 아래 홈 바·노치 영역까지 그린다 — 아래 고정 요소는 env(safe-area-inset-bottom) 로 비켜 선다 */
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

const DESCRIPTION = `${NAME_KO}(${NAME}) — ${TAGLINE} 업무 시스템의 화면 설계부터 개발까지 한 팀이 진행합니다.`;

/** 검색·공유 미리보기 — 제목과 설명에 읽는 이름(프롤로그엔)을 함께 둔다. 미리보기 배포는 검색에서 뺀다 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: `${NAME} (${NAME_KO}) — ${TAGLINE}`, template: `%s · ${NAME}` },
  description: DESCRIPTION,
  applicationName: NAME,
  alternates: { canonical: '/' },
  openGraph: { type: 'website', locale: 'ko_KR', siteName: NAME, url: '/', title: `${NAME} (${NAME_KO})`, description: DESCRIPTION },
  twitter: { card: 'summary_large_image', title: `${NAME} (${NAME_KO})`, description: DESCRIPTION },
  robots: shouldIndex(process.env.VERCEL_ENV) ? undefined : { index: false, follow: false },
  // 검색 등록 소유 확인 — 구글은 DNS(TXT)로 확인해 여기 없다
  verification: { other: { 'naver-site-verification': '6e881aee19f6745a7ae49b7038afd67475cf2bf5' } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <LenisProvider />
        {children}
        <RouteCommit />
        <InquiryDrawer />
        <ZoomViewer />
      </body>
    </html>
  );
}
