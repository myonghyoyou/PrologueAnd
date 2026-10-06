import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';
import { publishedProjects } from '@/content';

/** 검색에 알릴 주소 — 홈·목록·공개한 사례만(공개 전 편은 넣지 않는다) */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE}/projects`, changeFrequency: 'monthly', priority: 0.8 },
    ...publishedProjects().map((p) => ({ url: `${SITE}/projects/${p.slug}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
  ];
}
