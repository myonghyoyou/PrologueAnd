import { Header } from '@/components/header';
import { Dashboard } from '@/components/home/dashboard';
import { publishedProjects } from '@/content';

export default function Home() {
  return (
    <>
      <Header variant="home" />
      <main>
        <Dashboard published={publishedProjects().length} />
      </main>
    </>
  );
}
