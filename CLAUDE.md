# Prologue& — 작업 규칙

개인 브랜드 포트폴리오. Next 16 앱은 `web/`(Next 규칙은 `web/AGENTS.md`), 시안은 `design/`, 기획 문서는 `docs/`.
배포: Vercel(Root Directory `web`). **main 에 푸시하면 바로 배포된다.** `design/` 은 GitHub Pages 로 공개된다.

## 이 저장소는 공개다
- 회사 이름, 업종, 실제 지역, 실제 인물·거래처 이름을 코드·주석·테스트·커밋 메시지·시안 어디에도 쓰지 않는다.
- 금지 낱말 목록은 저장소 밖 `web/tests/banned.local.json`(커밋하지 않음)에만 둔다. 테스트는 `web/tests/banned.ts` 로 읽는다.
- `data/images/captures/` 는 커밋하지 않는다(실제 이름이 든 원본이 있다). 공개 그림은 `web/public/screens/` 에 가공본만.
- 공개 그림에 실제 이름·부서·거래처·문서명·업종 낱말이 보이면 안 된다. 실제 내용이 보이는 그림을 한 번이라도 커밋했다면 **푸시 전에 커밋을 합쳐** 기록에 남기지 않는다.
- 비밀값(메일 앱 비밀번호 등)은 Vercel 환경 변수에만. `.env*` 는 커밋하지 않는다.

## 실행
- 경로의 `&` 때문에 `npx`·`npm run` 이 깨진다. `web/` 에서 node 로 직접 부른다.
  - 타입: `node node_modules/typescript/bin/tsc --noEmit`
  - 테스트: `node node_modules/@playwright/test/cli.js test <파일> --workers=1 --reporter=line`
  - 빌드·서버: `node node_modules/next/dist/bin/next build` / `next start --port 3100`
- **포트 3000·3001 은 다른 앱이 쓴다. 절대 쓰거나 끄지 않는다.** 테스트·확인 서버는 3100.
- Playwright 설정은 3100 서버를 재사용한다. 코드를 바꿨으면 3100 을 끄고 다시 빌드한 뒤 테스트한다.
- 공개 그림을 같은 이름으로 바꿨으면 `web/.next/cache/images` 를 지운다(옛 그림이 나온다).

## git
- 커밋 메시지: `[ADD]` · `[MOD]` · `[FIX]` + 한글 제목(50자 이내)·한글 본문.
- **푸시는 사용자가 말할 때만.** 기록을 다시 쓰는 강제 푸시도 마찬가지.
- `docs/` · `.claude/` 는 사용자가 커밋하라고 할 때만 커밋한다.

## 사례 상세 페이지
`/projects/<slug>` 상세를 기획·수정·검토할 때는 `case-study` Skill 을 따른다.
