import type { MetadataRoute } from 'next';
import { SITE, shouldIndex } from '@/lib/site';

/** 검색 로봇 안내 — 미리보기 배포는 모두 막고, 실제 배포는 모두 열며 sitemap 을 알린다 */
export default function robots(): MetadataRoute.Robots {
  if (!shouldIndex(process.env.VERCEL_ENV)) return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: '/', disallow: '/api/' }, sitemap: `${SITE}/sitemap.xml`, host: SITE };
}
