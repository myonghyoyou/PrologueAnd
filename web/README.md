# Prologue& 웹사이트

Next.js로 만든 Prologue& 포트폴리오 사이트다(홈, 프로젝트 목록, 프로젝트 상세, 문의 폼).

## 로컬에서 실행하기

이 저장소 경로에 `&` 문자가 들어 있어서 `npx`나 `node_modules/.bin`의 `.cmd` 셸이 깨진다. 아래처럼 `node`를 직접 호출한다. 모든 명령은 `web/` 디렉터리에서 실행한다.

```bash
# 개발 서버 (3000번은 다른 프로젝트가 쓰고, 3100번은 테스트 전용이므로 다른 포트를 쓴다)
node node_modules/next/dist/bin/next dev -p 3200

# 테스트 (Playwright가 3100번 포트로 서버를 알아서 띄운다)
node node_modules/@playwright/test/cli.js test --project=w1440

# 타입 체크
node node_modules/typescript/bin/tsc --noEmit

# 프로덕션 빌드
npm run build
```

## 환경변수

`.env.example`을 복사해 `.env.local`을 만들고 값을 채운다. `.env.local`은 절대 커밋하지 않는다.

- `NEXT_PUBLIC_SITE_URL` — 배포된 사이트 주소. 이 값이 `vercel.app`이나 `localhost`면 검색엔진 색인을 막는다(noindex).
- `GMAIL_USER` — 문의 메일을 발송하는 Gmail 계정. `PrologueAnd@gmail.com`.
- `GMAIL_APP_PASSWORD` — 위 계정의 앱 비밀번호. 이 계정에 2단계 인증이 켜져 있어야 발급할 수 있다.
- `INQUIRY_TO` — 문의 메일을 받는 주소. `PrologueAnd@gmail.com`.

## 배포 체크리스트 (Vercel)

1. Vercel에서 이 저장소를 가져오고 **Root Directory**를 `web`으로 지정한다.
2. 위 환경변수 4개를 Production과 Preview 양쪽에 넣는다.
3. 첫 배포가 끝나면 발급된 주소를 `NEXT_PUBLIC_SITE_URL`에 넣고 다시 배포한다.
4. 배포본에서 손으로 세 가지를 확인한다(같은 빌드를 로컬에서 이미 검증했으므로 전체 테스트를 다시 돌리지 않는다).
   - [ ] `/projects`에서 Por favor, Harry로 들어가면 제목이 따라 움직인다.
   - [ ] 상세 페이지에서 휠 한 칸에 판이 하나씩 넘어간다.
   - [ ] 문의를 실제로 한 통 보내서 `PrologueAnd@gmail.com`에 도착하고, Gmail 전달 설정을 통해 실제 주소까지 오는지 확인한다.
