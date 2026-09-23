import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ProjectRow } from '@/components/project-row';
import { VtReturn } from '@/components/vt-return';
import { allProjects } from '@/content';
import s from './projects.module.css';

export const metadata: Metadata = { title: 'Projects' };

export default function ProjectsPage() {
  return (
    <>
      <Header variant="list" />
      <main className={`wrap ${s.main}`}>
        <VtReturn />
        <div className={s.head}>
          <h1 className={s.h1}>Projects</h1>
          <p className={s.lead}>지금까지 한 일. 이름 뒤의 빈칸을 채워 온 것들입니다.</p>
        </div>
        <div>{allProjects().map((p) => <ProjectRow key={p.slug} project={p} />)}</div>
        <Footer />
      </main>
    </>
  );
}
