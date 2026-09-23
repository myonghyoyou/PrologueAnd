import type { Page } from '@playwright/test';

/** Lenis 가 있으면 Lenis 로, 없으면 창으로 즉시 이동한다 */
export async function scrollToY(page: Page, y: number) {
  await page.evaluate((to) => {
    const l = (window as unknown as { __lenis?: { scrollTo: (y: number, o: object) => void } }).__lenis;
    if (l) l.scrollTo(to, { immediate: true }); else window.scrollTo(0, to);
  }, y);
  await page.waitForTimeout(200);
}
