import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { BriefTool } from '@/components/brief/brief-tool';
import s from '@/components/brief/page.module.css';

const DESC_EN = 'Answer a few questions and get a website brief you can send to any web designer. No sign-up or contact details, and your answers stay on this device.';

// 영어 metadata — twitter 도 따로 둔다(안 두면 루트 레이아웃의 한국어 값을 물려받는다, 명세 5절)
export const metadata: Metadata = {
  title: 'Website Brief Builder', description: DESC_EN,
  alternates: { canonical: '/en/tools/brief', languages: { ko: '/tools/brief', en: '/en/tools/brief' } },
  openGraph: { type: 'website', locale: 'en_US', siteName: 'Prologue&', url: '/en/tools/brief', title: 'Website Brief Builder · Prologue&', description: DESC_EN },
  twitter: { card: 'summary_large_image', title: 'Website Brief Builder · Prologue&', description: DESC_EN },
};

/** 영어 요청서 — 용지 크기를 강제하지 않는다(A4·Letter 둘 다 한 쪽, 명세 3-4). 문의 단추는 한국어 서랍이라 숨긴다 */
export default function BriefPageEn() {
  return (
    <>
      <Header variant="tool" hideContact />
      <main lang="en" className={s.main} data-brief-page><BriefTool locale="en" /></main>
    </>
  );
}
