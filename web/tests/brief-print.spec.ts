import { test, expect } from '@playwright/test';
import { fromKo, seedBrief, RICH, MIN, MAX, MID } from './brief-ko';

/** PDF 저장 — 답을 많이 해도 A4 한 쪽에 들어와야 한다(사용자 요청 2026-10-21). 답 세트는 영어판 인쇄 테스트도 써서 brief-ko.ts 에 둔다 */
for (const [name, answers] of [['많이 답한 요청서', RICH], ['필수 둘만 답한 요청서', MIN], ['거의 모든 칸 + 긴 글', MAX], ['칸을 많이 채운 요청서', MID]] as const) {
  test(`PDF 한 쪽 — ${name}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'w1440');   // PDF 는 화면 크기와 무관 — 한 번만
    await seedBrief(page, fromKo(answers), 'when', true);
    await expect(page.locator('[data-brief-doc]')).toBeVisible();
    await page.emulateMedia({ media: 'print' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
    expect(pages).toBe(1);
  });
}
