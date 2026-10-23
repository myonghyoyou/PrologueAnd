import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { OwnershipTool } from '@/components/ownership/ownership-tool';
import { ko } from '@/content/ownership/copy';
import s from './page.module.css';

export const metadata: Metadata = {
  title: ko.meta.title,
  description: ko.meta.desc,
  alternates: { canonical: '/tools/ownership', languages: { ko: '/tools/ownership', en: '/en/tools/ownership' } },
  openGraph: { type: 'website', locale: 'ko_KR', siteName: 'Prologue&', url: '/tools/ownership', title: `${ko.meta.title} · Prologue&`, description: ko.meta.desc },
};

export default function OwnershipPage() {
  return (
    <>
      <Header variant="tool" />
      <main className={s.main} data-own-page><OwnershipTool locale="ko" /></main>
    </>
  );
}
