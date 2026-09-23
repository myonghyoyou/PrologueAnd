import type { Metadata } from 'next';
import { Bodoni_Moda } from 'next/font/google';
import localFont from 'next/font/local';
import { LenisProvider } from '@/components/lenis-provider';
import { InquiryDrawer } from '@/components/inquiry-drawer';
import { RouteCommit } from '@/components/route-commit';
import './globals.css';

const serif = Bodoni_Moda({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-serif', display: 'swap' });
const sans = localFont({
  src: [{ path: '../public/fonts/PretendardVariable.woff2', weight: '45 920', style: 'normal' }],
  variable: '--font-sans', display: 'swap',
});

const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: 'Prologue&', template: 'Prologue & %s' },
  description: '복잡한 업무를 단순한 제품으로 바꿉니다.',
  robots: site.includes('vercel.app') || site.includes('localhost') ? { index: false, follow: false } : undefined,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <LenisProvider />
        {children}
        <RouteCommit />
        <InquiryDrawer />
      </body>
    </html>
  );
}
