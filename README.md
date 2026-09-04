# 청년부 통합 플랫폼

교회 청년부 카페 음료 주문, 마을 관리, 마을 편성을 한 곳에서 처리하는 웹 앱. 1단계는 로그인 없이 쓰는 게스트 카페 주문만 다룬다.

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
npm test          # 컴포넌트/유닛 테스트 (jsdom, 40개)
npm run test:db   # DB 스키마·RLS·RPC 테스트 — supabase db reset 후 실행 (24개), .env.test 필요
npm run e2e       # 게스트 주문→취소 E2E (Playwright, Chromium), .env.test 필요
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

## 배포 (Vercel)

`vercel.json`은 `react-router-dom`의 `createBrowserRouter`가 쓰는 클라이언트 사이드 라우팅을
위해 모든 경로를 `index.html`로 되돌린다 (`/orders` 같은 딥링크 새로고침 대응).

Vercel 프로젝트에 환경 변수 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 설정한다.

### 운영 데이터베이스 반영 (개발자 승인 필요)

마이그레이션 대상 `youth-hanshin` 프로젝트는 v1이 지금 쓰고 있는 운영 DB다. 아래 절차는
개발자의 명시적 승인 없이는 실행하지 않는다.

1. `supabase link --project-ref <youth-hanshin ref>`
2. `db push` 전에 v1 객체와 이름이 겹치는지 확인한다:
   - `select typname from pg_type where typname in ('menu_category','order_item_status','app_role')`
   - `select proname from pg_proc where proname = 'active_cohort_id'`
   - 겹치면 그 객체에 `_v2`를 붙이고 `supabase/migrations/0001_core.sql`(정의)과
     `supabase/migrations/0004_place_order.sql`(`active_cohort_id()` 호출부)을 고친 뒤 다시 확인한다.
3. `supabase db push`
4. `cohorts_v2`·`cafe_settings_v2`·`menus_v2` 초기 데이터를 1회 입력한다.

모든 마이그레이션은 `_v2` 접미사가 붙은 새 객체만 만들고 v1 객체는 건드리지 않는다.
