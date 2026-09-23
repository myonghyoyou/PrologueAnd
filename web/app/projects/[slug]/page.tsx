import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { StudyView } from '@/components/case/study-view';
import { getProject, getStudy, nextProject, publishedProjects } from '@/content';
import { resolveStudy } from '@/content/resolve';

export function generateStaticParams() {
  return publishedProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  return { title: p?.title ?? 'Projects', description: p?.tagline };
}

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  const study = project ? getStudy(slug) : undefined;
  if (!project || !project.published || !study) redirect('/projects');
  return (
    <>
      <Header variant="case" title={project.title} project={project.slug} />
      <StudyView study={resolveStudy(study)} project={project} next={nextProject(slug)} />
    </>
  );
}
