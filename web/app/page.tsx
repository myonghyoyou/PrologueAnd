import { Header } from '@/components/header';
import { Dashboard } from '@/components/home/dashboard';
import { HomePhone } from '@/components/home/home-phone';
import { publishedProjects } from '@/content';

export default function Home() {
  const ps = publishedProjects();
  return (
    <>
      <Header variant="home" />
      <main>
        <Dashboard published={ps.length} />
        <HomePhone projects={ps.map((p) => ({ slug: p.slug, title: p.title, year: p.year }))} />
      </main>
    </>
  );
}
