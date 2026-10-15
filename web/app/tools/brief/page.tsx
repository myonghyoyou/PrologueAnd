import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { BriefTool } from '@/components/brief/brief-tool';
import s from './page.module.css';

const DESC = '질문에 답하면 어느 업체에나 보낼 수 있는 홈페이지 제작 요청서가 만들어져요. 가입·연락처 없이, 입력한 내용은 이 기기에만 저장돼요.';

export const metadata: Metadata = {
  title: '홈페이지 요청서 만들기',
  description: DESC,
  alternates: { canonical: '/tools/brief' },
  openGraph: { type: 'website', locale: 'ko_KR', siteName: 'Prologue&', url: '/tools/brief', title: '홈페이지 요청서 만들기 · Prologue&', description: DESC },
};

export default function BriefPage() {
  return (
    <>
      <Header variant="tool" />
      <main className={s.main} data-brief-page><BriefTool /></main>
    </>
  );
}
