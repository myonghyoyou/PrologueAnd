import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { CaseView } from '@/components/case/case-view';
import { getCase, getProject, nextProject, publishedProjects } from '@/content';

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
  const data = project ? getCase(slug) : undefined;
  if (!project || !project.published || !data) redirect('/projects');
  return (
    <>
      <Header variant="case" title={project.title} project={project.slug} />
      <CaseView data={data} project={project} next={nextProject(slug)} />
    </>
  );
}
