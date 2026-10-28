import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { InquiryDock } from '@/components/inquiry-dock';
import { ProjectRow } from '@/components/project-row';
import { VtReturn } from '@/components/vt-return';
import { allProjects } from '@/content';
import s from './projects.module.css';

const DESC = '프롤로그엔(Prologue&)이 만든 업무 시스템 사례입니다. 엑셀과 종이로 하던 일을 어떤 화면으로 바꿨는지 사례별로 볼 수 있습니다.';

export const metadata: Metadata = {
  title: 'Projects',
  description: DESC,
  alternates: { canonical: '/projects' },
  openGraph: { type: 'website', locale: 'ko_KR', siteName: 'Prologue&', url: '/projects', title: 'Projects · Prologue&', description: DESC },
};

export default function ProjectsPage() {
  return (
    <>
      <Header variant="list" />
      <main className={`wrap ${s.main}`}>
        <VtReturn />
        <div className={s.head}>
          <h1 className={s.h1}>Projects</h1>
        </div>
        <div>{allProjects().map((p) => <ProjectRow key={p.slug} project={p} />)}</div>
        <Footer />
      </main>
      <InquiryDock mode="list" />
    </>
  );
}
