import { Header } from '@/components/header';
import { Dashboard } from '@/components/home/dashboard';
import { HomePhone } from '@/components/home/home-phone';
import { publishedProjects } from '@/content';
import { SITE, NAME, ALT_NAMES, TAGLINE } from '@/lib/site';
import { CONTACT_MAIL } from '@/lib/contact';

/** 구조화 데이터 — 구글이 "Prologue&"와 "프롤로그엔"을 같은 사이트·브랜드 이름으로 알아보게 한다 */
const LD = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', '@id': `${SITE}/#website`, url: SITE, name: NAME, alternateName: ALT_NAMES, description: TAGLINE, inLanguage: 'ko-KR',
      publisher: { '@id': `${SITE}/#org` } },
    { '@type': 'Organization', '@id': `${SITE}/#org`, url: SITE, name: NAME, alternateName: ALT_NAMES, logo: `${SITE}/icon.png`, email: CONTACT_MAIL },
  ],
};

export default function Home() {
  const ps = publishedProjects();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LD) }} />
      <Header variant="home" />
      <main>
        <Dashboard published={ps.length} />
        <HomePhone projects={ps.map((p) => ({ slug: p.slug, title: p.title, year: p.year }))} />
      </main>
    </>
  );
}
