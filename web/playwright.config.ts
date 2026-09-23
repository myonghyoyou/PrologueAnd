import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://127.0.0.1:3100' },
  // 프로덕션 빌드를 상대로 잰다. 개발 서버는 요청마다 컴파일해서, 병렬로 도는 이 스위트의 부하에서는 새 경로 커밋이
  // lib/route-commit 의 500ms 안전장치를 넘는다(실측 110~500ms+) — 그러면 전환이 옛 화면을 찍어 C1 이 무작위로 실패한다.
  // 프로덕션은 같은 부하에서 31~56ms. 제품 코드가 아니라 개발 서버의 응답 속도를 재던 것을 걷어낸다.
  webServer: { command: 'npm run build && npm run start -- --port 3100', url: 'http://127.0.0.1:3100', reuseExistingServer: true, timeout: 180_000 },
  projects: [
    { name: 'w1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'w1280', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } } },
    { name: 'w2560', use: { ...devices['Desktop Chrome'], viewport: { width: 2560, height: 1249 } } },
    { name: 'phone', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
