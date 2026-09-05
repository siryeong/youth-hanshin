# 청년부 통합 플랫폼

교회 청년부 통합 웹 앱. 게스트·회원 음료 주문, 카카오 로그인·내 정보, 기수별 내 마을·출석·소식·기도제목을 제공한다.

## 로컬 개발

```bash
supabase start    # 로컬 Supabase 스택 기동
supabase status   # API URL, anon key, service_role key 확인
```

앱이 쓰는 `.env.local`과, `npm run test:db`·`npm run e2e`가 쓰는 `.env.test`를 각각 만든다:

```bash
cp .env.local.example .env.local
# supabase status 의 API URL, anon key 를 .env.local 에 채운다

cp .env.test.example .env.test
# supabase status 의 API URL, anon key, service_role key 를 .env.test 에 채운다
```

`.env.test`가 없으면 `npm run test:db`와 `npm run e2e`가 불친절한 오류로 죽는다 — 아래 세
테스트 명령 중 두 개가 이 파일을 필요로 한다.

```bash
npm install
npx playwright install chromium   # E2E 첫 실행 전 1회
npm run dev                       # http://127.0.0.1:5173
```

`.env.local`, `.env.test` 모두 커밋하지 않는다 (`.gitignore` 처리됨. `.env.local.example`,
`.env.test.example`만 추적된다).

## 테스트

```bash
npm test          # 컴포넌트/유닛 테스트 (jsdom)
npm run test:db   # DB 스키마·RLS·RPC 테스트 — supabase db reset 후 실행 (24개), .env.test 필요
npm run e2e       # 게스트 주문→취소 E2E (Playwright, Chromium), .env.test 필요
npm run test:ui   # 외부 인증/API를 모킹한 로그인·주문·마을 브라우저 테스트
npm run test:db:village # 로컬 DB 트랜잭션으로 마을·인증·주문 권한 검증, 초기화·환경 파일 불필요
```

`npm run e2e`는 `npm run dev`를 자동으로 띄우고 `.env.test`의 서비스 키로 `cafe_settings_v2`를
실행 전 오늘 요일·`00:00~23:59`로 넓혔다가 끝나면 시드값(주일 10:00~14:30)으로 되돌린다
(`e2e/global-setup.ts`). 이 값은 `npm run test:db`가 기대하는 시드 상태이기도 하므로,
두 명령을 같은 로컬 스택에서 번갈아 돌려도 서로 깨지지 않는다. 되돌리기가 실패하면 조용히
넘어가지 않고 에러를 던진다 — 그래야 다음 `npm run test:db`가 엉뚱하게 `schema.test.ts`에서
깨지는 대신, 원인이 이 되돌리기였다는 게 바로 드러난다.

## 빌드/정적 분석

```bash
npm run lint
npm run build
```

## 카카오 로그인 설정

`/login`에서 [카카오로 시작하기]를 누르면 로그인 후 `/profile`로 이동한다. `/profile`에서는
이름·성별·생년월일·휴대폰번호와 항목별 공개 설정을 저장한다. `/orders`에서는 기수별로
본인 주문을 조회한다. 게스트 주문은 기존 브라우저의 게스트 내역으로 남는다.

1. 로컬 DB에 `supabase migration up --local`로 `0010_villages.sql`까지 적용한다.
2. [Supabase 카카오 설정 가이드](https://supabase.com/docs/guides/auth/social-login/auth-kakao)에 따라
   카카오 로그인과 `profile_nickname`, `profile_image` 동의 항목을 설정한다.
3. 카카오 앱의 Redirect URI에 대상 Supabase의 `/auth/v1/callback` 주소를 등록한다.
   로컬은 `http://127.0.0.1:54321/auth/v1/callback`, 운영은 `https://<project-ref>.supabase.co/auth/v1/callback`이다.
4. Supabase의 Kakao 공급자에 REST API 키와 Client Secret을 설정하고 이메일 없는 로그인을 허용한다.
   로컬은 환경 변수 `SUPABASE_AUTH_EXTERNAL_KAKAO_CLIENT_ID`, `SUPABASE_AUTH_EXTERNAL_KAKAO_SECRET`을
   설정한 뒤 `supabase/config.toml`의 `[auth.external.kakao].enabled`를 `true`로 바꾸고 로컬 스택을 다시 시작한다.
5. Supabase Redirect URLs에 앱의 `/login` 주소를 등록한다. 로컬 주소는 `config.toml`에 있으며,
   배포 환경에는 `https://<배포 도메인>/login`을 등록한다.

카카오 REST API 키와 Client Secret은 브라우저의 `VITE_*` 환경 변수에 넣지 않는다. 운영 DB·인증 설정 변경은 개발자 승인 후 실행한다.

신규 사용자는 `youth` 역할로 생성한다. 관리자는 동일한 카카오 로그인 경로를 사용하며,
승인된 DB 작업으로 해당 사용자의 `profiles_v2.role`을 `admin`으로 지정해야 한다.
역할 변경 화면과 관리자 운영 기능은 4단계 범위다.

프로필은 v2 최초 접근 시 생성한다. 기존 이름·공개 설정·역할은 유지하고, 마지막 로그인 시각은
`auth.users.last_sign_in_at`을 사용한다. 공유 중인 v1 인증 테이블에 트리거를 추가하지 않는다.
계정이나 역할이 바뀌면 장바구니·조회 캐시·화면 상태를 초기화한다. 역할은 Realtime과 30초 재조회로 갱신한다.

## 내 마을

`/village`에서 기수·마을을 선택해 명단, 주일별 출석, 소식과 기도제목을 조회한다.
이장은 마을 이름과 소식을 관리하고, 최근 주일을 포함한 4주의 예배·마을모임 출석을 수정한다.
기도제목은 소속 마을원이 등록하며 본인 글만 수정·삭제한다. 전체 관리자는 모든 마을을 조회한다.

로컬 DB에는 `supabase migration up --local`로 `0010_villages.sql`까지 적용한다.
마을과 배정 데이터가 없으면 미배정 안내를 표시한다. 기수·마을 생성과 인원 배정 UI는 4단계 범위다.
스키마·권한 결정과 검증 방법은 [3단계 구현 문서](docs/superpowers/plans/2026-09-05-phase3-villages.md)에 기록했다.

## 배포 (Vercel)

`vercel.json`은 `react-router-dom`의 `createBrowserRouter`가 쓰는 클라이언트 사이드 라우팅을
위해 모든 경로를 `index.html`로 되돌린다 (`/orders` 같은 딥링크 새로고침 대응).

Vercel 프로젝트에 환경 변수 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 설정한다.

### Preview에서 로그인 테스트

1. 테스트용 Supabase에 `0010_villages.sql`까지 적용하고 카카오 공급자를 설정한다.
2. Vercel [Settings] > [Environment Variables]에서 위 두 환경 변수를 **Preview** 환경에 설정한다.
   테스트용 Supabase의 URL과 anon key를 사용한다.
3. 변경 코드를 Preview로 배포한다. 환경 변수를 변경한 뒤에는 새 배포가 필요하다.
4. Supabase [Authentication] > [URL Configuration] > [Redirect URLs]에
   `https://<Preview 도메인>/login`을 등록한다. 앱은 접속한 도메인을 사용하므로 Site URL을 Preview로 바꿀 필요가 없다.
5. 카카오 Redirect URI는 `https://<테스트용 Supabase project-ref>.supabase.co/auth/v1/callback`으로 등록한다.
6. 같은 브라우저에서 Preview의 `/login`에 접속하고 [카카오로 시작하기]를 누른다.
   `/profile` 도착, 정보 저장·새로고침, 로그아웃을 확인한다.

Preview에 Vercel Authentication이 적용되어 있으면 먼저 해당 배포에 접근할 수 있는 Vercel 계정으로 로그인한다.
Preview 주소가 바뀌면 Supabase의 허용 주소도 추가한다. 운영 Supabase를 연결하면 Preview의 로그인·정보 수정도 운영 DB에 반영된다.

설정 기준: [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls),
[Vercel 환경](https://vercel.com/docs/deployments/environments),
[Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication).

### 운영 데이터베이스 반영 (개발자 승인 필요)

마이그레이션 대상 `youth-hanshin` 프로젝트는 v1이 지금 쓰고 있는 운영 DB다. 아래 절차는
개발자의 명시적 승인 없이는 실행하지 않는다.

1. `supabase link --project-ref <youth-hanshin ref>`
2. `db push` 전에 v1 객체와 이름이 겹치는지 확인한다:
   - `select typname from pg_type where typname in ('menu_category','order_item_status','app_role')`
   - ```sql
     select proname from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and proname in ('active_cohort_id','is_admin_or_staff','cafe_is_open','cafe_status','place_order','get_guest_orders','cancel_order_item');
     ```
   - 겹치면 그 객체에 `_v2`를 붙이고 `supabase/migrations/0001_core.sql`(정의)과
     `supabase/migrations/0004_place_order.sql`(`active_cohort_id()` 호출부)을 고친 뒤 다시 확인한다.
3. `supabase db push`
4. `cohorts_v2`·`cafe_settings_v2`·`menus_v2` 초기 데이터를 1회 입력한다.

테이블과 뷰는 `_v2` 접미사가 붙은 새 객체만 만들고 v1 객체는 건드리지 않는다. 함수와 enum
타입은 접미사가 없으므로 위 사전 점검을 반드시 통과해야 한다.
