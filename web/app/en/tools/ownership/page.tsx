import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { OwnershipTool } from '@/components/ownership/ownership-tool';
import { en } from '@/content/ownership/copy';
import s from './page.module.css';

const TITLE = `${en.meta.title} · Prologue&`;

/** 영어판 — 루트 설정(한국어)을 항목 단위로 덮으므로 공유 미리보기·트위터 카드도 영어로 다시 적는다 */
export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: en.meta.desc,
  alternates: { canonical: '/en/tools/ownership', languages: { ko: '/tools/ownership', en: '/en/tools/ownership' } },
  openGraph: { type: 'website', locale: 'en_US', siteName: 'Prologue&', url: '/en/tools/ownership', title: TITLE, description: en.meta.desc },
  twitter: { card: 'summary_large_image', title: TITLE, description: en.meta.desc },
};

export default function OwnershipPageEn() {
  return (
    <>
      <Header variant="tool" hideContact />
      <main className={s.main} data-own-page><div lang="en"><OwnershipTool locale="en" /></div></main>
    </>
  );
}
