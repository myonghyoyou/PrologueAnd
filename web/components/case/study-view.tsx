import type { Project, Study } from '@/content';
import { Cover } from './cover';
import { Chapter } from './chapter';
import { Closing } from './closing';
import { ChapterBar } from './chapter-bar';
import { InquiryDock } from '../inquiry-dock';

export function StudyView({ study, project, next }: { study: Study; project: Project; next?: Project }) {
  return (
    <main className="wrap">
      <ChapterBar chapters={study.chapters.map((c) => ({ id: c.id, name: c.name }))} />
      <Cover study={study} project={project} />
      {study.chapters.map((ch, i) => <Chapter key={ch.id} ch={ch} n={i + 1} />)}
      <Closing study={study} next={next} slug={project.slug} />
      <InquiryDock project={project.slug} mode="case" />
    </main>
  );
}
