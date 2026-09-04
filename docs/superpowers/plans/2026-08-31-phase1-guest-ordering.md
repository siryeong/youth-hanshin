# 1단계 — 기반과 게스트 주문 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 로그인 없이 메뉴를 골라 주문하고 마감 전까지 취소할 수 있는, 배포 가능한 최소 버전을 만든다.

**Architecture:** Vite + React + TypeScript 단일 SPA. 데이터는 Supabase에 직접 붙고, 시간·권한 검증이 필요한 쓰기는 `SECURITY DEFINER` RPC를 거친다. 게스트는 테이블에 직접 접근하지 않고 RPC만 호출한다. 디자인 토큰은 CSS 커스텀 프로퍼티 한 파일에 두고 `[data-theme]`로 값만 바꾼다.

**Tech Stack:** React 19, TypeScript, Vite, @supabase/supabase-js v2, @tanstack/react-query v5, react-router-dom v7, zod, date-fns, Vitest + React Testing Library, Playwright, Supabase CLI(로컬 Postgres), Vercel

**Spec:** `요구사항.md` / `docs/superpowers/plans/2026-08-31-implementation-roadmap.md` / 디자인 시스템 캔버스 https://claude.ai/code/artifact/6e4bb82b-f794-4907-9579-393d03e9b285 (아트보드 소스는 `design/`)

## Global Constraints

요구사항에서 그대로 옮긴 제약이다. 아래 모든 태스크에 적용된다.

- 메뉴 가격은 청년과 게스트에게 보여주지 않는다.
- 주문 마감 시각이 지나면 새 주문과 주문 취소를 모두 막는다.
- 기본 주문 시간대는 주일 오전 10시부터 오후 2시 30분까지다.
- 주문 상태는 주문과 취소 2개다. 제조 진행 상태는 관리하지 않는다.
- 메뉴를 삭제해도 과거 주문 내역은 주문 당시의 메뉴명과 옵션으로 남는다.
- 게스트는 세션이 유지되는 동안만 취소한다.
- 모든 테이블에 RLS를 적용한다. 권한 검증은 DB에서 한다.
- 터치 타깃은 최소 44px로 한다.
- 데스크톱과 모바일 화면을 지원한다. 리사이즈에 곧바로 대응한다.
- 라이트·다크 테마를 전환한다. 선택값을 로컬에 저장하고 재방문 시 복원한다.
- 시간 계산은 모두 `Asia/Seoul` 기준이다. 마감 판단에 클라이언트 시계를 쓰지 않는다.
- 메뉴와 가격은 `한신카페메뉴판.jpeg`(2025 한신교회 DRINKS MENU)를 그대로 따른다. 메뉴를 지어내지 않는다. ICE 는 커피·논커피에서 +1,000원, COLD DRINKS 는 ICE 전용이다.
- 메뉴판의 계좌번호와 예금주는 개인정보다. 코드·시드·디자인 어디에도 넣지 않는다.
- Supabase 는 기존 `youth-hanshin` 프로젝트를 그대로 쓴다. **새로 만드는 모든 테이블과 뷰의 이름은 `_v2` 로 끝난다.** v1 스키마(`accounts`, `cafe_menu_items`, `cafe_orders`, `cafe_settings`, `event_participants`, `gift_exchange_matches`, `members`, `villages`)는 읽지도 고치지도 않는다.
- 디자인: 컨테이너에 테두리를 두르지 않고 그림자를 쓰지 않는다. 층위는 면의 밝기로 만든다. 헤어라인은 그룹 리스트 안쪽에만 쓴다. 글자 크기는 32·24·22·20·17·15·14·13·12·11 열 단계만 쓴다.

## File Structure

| 파일 | 책임 |
|---|---|
| `src/styles/tokens.css` | 디자인 토큰 전부. 라이트는 `:root`, 다크는 `[data-theme="dark"]` |
| `src/styles/base.css` | 리셋, `body`, 링크, 한글 조판 기본값 |
| `src/lib/theme.ts` | 테마 읽기·적용·복원 |
| `src/lib/supabase.ts` | Supabase 클라이언트 한 개 |
| `src/lib/guestToken.ts` | 게스트 토큰 발급과 보관 |
| `src/components/ui/*` | Button, Chip, Switch, Stepper, Sheet, Toast, EmptyState, TabBar |
| `src/features/cafe/api.ts` | Supabase 호출만 모은 곳. 컴포넌트는 여기만 본다 |
| `src/features/cafe/useMenus.ts` / `useCart.ts` / `useCafeStatus.ts` | 화면 상태 |
| `src/features/cafe/OrderPage.tsx` / `OptionSheet.tsx` / `MyOrdersPage.tsx` | 화면 |
| `supabase/migrations/*.sql` | 스키마·RLS·RPC. 번호 순서로 적용된다 |
| `supabase/tests/*.test.ts` | 로컬 DB 대상 RLS·RPC 통합 테스트 |
| `e2e/*.spec.ts` | Playwright |

---

### Task 1: 프로젝트 셋업

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `vitest.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/test/setup.ts`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: 없음
- Produces: `App` 컴포넌트(default export 아님, `export function App()`)

- [ ] **Step 1: 프로젝트 생성과 의존성 설치**

```bash
npm create vite@latest . -- --template react-ts
npm i @supabase/supabase-js @tanstack/react-query react-router-dom zod date-fns
npm i -D vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

- [ ] **Step 2: Vitest 설정**

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
```

`src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

`package.json`의 `scripts`에 추가:

```json
{ "test": "vitest run", "test:watch": "vitest" }
```

- [ ] **Step 3: 실패하는 테스트 작성**

`src/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { App } from './App'

test('주문 화면 제목을 보여준다', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: '청년부 카페' })).toBeInTheDocument()
})
```

- [ ] **Step 4: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./App"` 또는 `App is not exported`

- [ ] **Step 5: 최소 구현**

`src/App.tsx`:

```tsx
export function App() {
  return <h1>청년부 카페</h1>
}
```

`src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `npm test`
Expected: PASS 1개

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "chore: Vite + React + TypeScript + Vitest 셋업"
```

---

### Task 2: 디자인 토큰과 테마 전환

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/base.css`, `src/lib/theme.ts`
- Modify: `src/main.tsx`
- Test: `src/lib/theme.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `type Theme = 'light' | 'dark' | 'system'`, `readTheme(): Theme`, `applyTheme(t: Theme): void`, `initTheme(): void`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/theme.test.ts`:

```ts
import { beforeEach, expect, test } from 'vitest'
import { applyTheme, initTheme, readTheme } from './theme'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

test('기본값은 system 이고 속성을 남기지 않는다', () => {
  expect(readTheme()).toBe('system')
  applyTheme('system')
  expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
})

test('고른 테마를 속성과 로컬 저장소에 남긴다', () => {
  applyTheme('dark')
  expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  expect(readTheme()).toBe('dark')
})

test('재방문 시 저장된 테마를 복원한다', () => {
  localStorage.setItem('yh.theme', 'light')
  initTheme()
  expect(document.documentElement.getAttribute('data-theme')).toBe('light')
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test src/lib/theme.test.ts`
Expected: FAIL — `Failed to resolve import "./theme"`

- [ ] **Step 3: 토큰 작성**

`src/styles/tokens.css` — 값은 디자인 캔버스의 컬러 토큰 아트보드와 1:1로 맞춘다:

```css
:root {
  --bg: #F4F0E7;
  --surface: #FFFFFF;
  --fill: #EAE3D6;
  --fill-strong: #DFD6C6;
  --separator: rgba(38, 30, 22, 0.07);
  --text: #171310;
  --text-2: #4A423A;
  --text-muted: #7C7268;
  --text-disabled: #A79E93;
  --accent-fill: #F2CCD5;
  --accent-soft: #F9E5EA;
  --accent-text: #A8475E;
  --success: #3E7A5E;
  --warning: #A9701F;
  --danger: #A93F3C;

  --text-display: 32px;
  --text-title-lg: 24px;
  --text-screen: 22px;
  --text-title: 20px;
  --text-subtitle: 17px;
  --text-body: 15px;
  --text-label: 14px;
  --text-caption: 13px;
  --text-micro: 12px;
  --text-nano: 11px;

  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-12: 48px;

  --radius-chip: 8px; --radius-field: 12px; --radius-card: 16px;
  --radius-sheet: 22px; --radius-pill: 999px;

  --control-lg: 48px; --control: 44px; --control-pc: 40px; --control-sm: 34px;

  --dur-fast: 120ms; --dur-base: 180ms; --dur-sheet: 260ms;
  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);

  --font-sans: "IBM Plex Sans KR", "Apple SD Gothic Neo", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;
}

[data-theme="dark"] {
  --bg: #14120F;
  --surface: #211D18;
  --fill: #2C261F;
  --fill-strong: #3A332B;
  --separator: rgba(246, 241, 233, 0.10);
  --text: #F6F1E9;
  --text-2: #CFC6BA;
  --text-muted: #9A9084;
  --text-disabled: #6E655B;
  --accent-fill: #E7ADBA;
  --accent-soft: #332629;
  --accent-text: #F0BFC9;
  --success: #7FBFA1;
  --warning: #D9A75B;
  --danger: #E08C89;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #14120F;
    --surface: #211D18;
    --fill: #2C261F;
    --fill-strong: #3A332B;
    --separator: rgba(246, 241, 233, 0.10);
    --text: #F6F1E9;
    --text-2: #CFC6BA;
    --text-muted: #9A9084;
    --text-disabled: #6E655B;
    --accent-fill: #E7ADBA;
    --accent-soft: #332629;
    --accent-text: #F0BFC9;
    --success: #7FBFA1;
    --warning: #D9A75B;
    --danger: #E08C89;
  }
}
```

`src/styles/base.css`:

```css
* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: var(--text-body);
  line-height: 1.6;
  word-break: keep-all;
  text-wrap: pretty;
  -webkit-font-smoothing: antialiased;
}

a { color: var(--accent-text); text-decoration: none; }
button { font: inherit; color: inherit; cursor: pointer; border: 0; background: none; }
```

- [ ] **Step 4: 테마 모듈 구현**

`src/lib/theme.ts`:

```ts
export type Theme = 'light' | 'dark' | 'system'

const KEY = 'yh.theme'

export function readTheme(): Theme {
  const saved = localStorage.getItem(KEY)
  return saved === 'light' || saved === 'dark' ? saved : 'system'
}

export function applyTheme(theme: Theme): void {
  if (theme === 'system') {
    localStorage.removeItem(KEY)
    document.documentElement.removeAttribute('data-theme')
    return
  }
  localStorage.setItem(KEY, theme)
  document.documentElement.setAttribute('data-theme', theme)
}

export function initTheme(): void {
  applyTheme(readTheme())
}
```

`src/main.tsx`에 추가:

```tsx
import './styles/tokens.css'
import './styles/base.css'
import { initTheme } from './lib/theme'

initTheme()
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test src/lib/theme.test.ts`
Expected: PASS 3개

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat: 디자인 토큰과 테마 전환"
```

---

### Task 3: 기본 컴포넌트

**Files:**
- Create: `src/components/ui/Button.tsx`, `src/components/ui/Button.module.css`, `src/components/ui/Chip.tsx`, `src/components/ui/Chip.module.css`, `src/components/ui/Stepper.tsx`, `src/components/ui/Stepper.module.css`
- Test: `src/components/ui/Button.test.tsx`, `src/components/ui/Stepper.test.tsx`

**Interfaces:**
- Consumes: `src/styles/tokens.css`의 토큰
- Produces:
  - `Button(props: { variant?: 'primary' | 'accent' | 'secondary' | 'danger'; size?: 'lg' | 'md'; disabled?: boolean; ariaLabel?: string; onClick?: () => void; children: ReactNode })`
  - `Chip(props: { selected?: boolean; onClick?: () => void; children: ReactNode })`
  - `Stepper(props: { value: number; min: number; max: number; onChange: (next: number) => void; label: string })`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/ui/Button.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

test('누르면 onClick 을 부른다', async () => {
  const onClick = vi.fn()
  render(<Button onClick={onClick}>담기</Button>)
  await userEvent.click(screen.getByRole('button', { name: '담기' }))
  expect(onClick).toHaveBeenCalledOnce()
})

test('disabled 면 눌러도 부르지 않는다', async () => {
  const onClick = vi.fn()
  render(<Button disabled onClick={onClick}>담기</Button>)
  await userEvent.click(screen.getByRole('button', { name: '담기' }))
  expect(onClick).not.toHaveBeenCalled()
})
```

`src/components/ui/Stepper.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Stepper } from './Stepper'

test('최댓값에서는 더 늘리지 않는다', async () => {
  const onChange = vi.fn()
  render(<Stepper label="샷 추가" value={2} min={0} max={2} onChange={onChange} />)
  await userEvent.click(screen.getByRole('button', { name: '샷 추가 늘리기' }))
  expect(onChange).not.toHaveBeenCalled()
})

test('최솟값 위에서는 줄인다', async () => {
  const onChange = vi.fn()
  render(<Stepper label="수량" value={2} min={1} max={9} onChange={onChange} />)
  await userEvent.click(screen.getByRole('button', { name: '수량 줄이기' }))
  expect(onChange).toHaveBeenCalledWith(1)
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test src/components/ui`
Expected: FAIL — `Failed to resolve import "./Button"`

- [ ] **Step 3: 구현**

`src/components/ui/Button.module.css`:

```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: var(--control);
  padding: 0 var(--space-4);
  border-radius: var(--radius-field);
  font-size: var(--text-label);
  font-weight: 500;
}
.lg { height: var(--control-lg); font-size: var(--text-body); }
.primary { background: var(--text); color: var(--surface); }
.accent { background: var(--accent-fill); color: #171310; }
.secondary { background: var(--fill); color: var(--text); }
.danger { background: var(--danger); color: #FFFFFF; }
.button:disabled { background: var(--fill); color: var(--text-disabled); cursor: default; }
```

`src/components/ui/Button.tsx`:

```tsx
import type { ReactNode } from 'react'
import styles from './Button.module.css'

type Props = {
  variant?: 'primary' | 'accent' | 'secondary' | 'danger'
  size?: 'lg' | 'md'
  disabled?: boolean
  ariaLabel?: string
  onClick?: () => void
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', disabled, ariaLabel, onClick, children }: Props) {
  const className = [styles.button, styles[variant], size === 'lg' ? styles.lg : ''].join(' ').trim()
  return (
    <button type="button" aria-label={ariaLabel} className={className} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}
```

`src/components/ui/Stepper.module.css`:

```css
.stepper { display: inline-flex; align-items: center; background: var(--fill); border-radius: var(--radius-field); }
.step { width: var(--control); height: var(--control); display: grid; place-items: center; }
.step:disabled { color: var(--text-disabled); cursor: default; }
.value { min-width: 32px; text-align: center; font-family: var(--font-mono); font-weight: 500; }
```

`src/components/ui/Stepper.tsx`:

```tsx
import styles from './Stepper.module.css'

type Props = { value: number; min: number; max: number; onChange: (next: number) => void; label: string }

export function Stepper({ value, min, max, onChange, label }: Props) {
  return (
    <div className={styles.stepper}>
      <button
        type="button"
        className={styles.step}
        aria-label={`${label} 줄이기`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span className={styles.value}>{value}</span>
      <button
        type="button"
        className={styles.step}
        aria-label={`${label} 늘리기`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  )
}
```

`src/components/ui/Chip.module.css`:

```css
.chip { display: inline-flex; align-items: center; justify-content: center; height: var(--control); padding: 0 var(--space-4); border-radius: var(--radius-pill); background: var(--fill); color: var(--text-2); font-size: var(--text-caption); font-weight: 500; }
.selected { background: var(--accent-fill); color: #171310; font-weight: 600; }
```

`src/components/ui/Chip.tsx`:

```tsx
import type { ReactNode } from 'react'
import styles from './Chip.module.css'

export function Chip({ selected, onClick, children }: { selected?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={selected} className={`${styles.chip} ${selected ? styles.selected : ''}`} onClick={onClick}>
      {children}
    </button>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test src/components/ui`
Expected: PASS 4개

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: Button, Chip, Stepper 기본 컴포넌트"
```

---

### Task 4: Supabase 로컬과 스키마 1차

**Files:**
- Create: `supabase/config.toml`(CLI 생성), `supabase/migrations/0001_core.sql`, `supabase/seed.sql`, `vitest.db.config.ts`, `supabase/tests/client.ts`
- Test: `supabase/tests/schema.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: 테이블 `cohorts`, `profiles`, `menus`, `cafe_settings`, `cafe_closures`, `orders`, `order_items`. 헬퍼 `public.active_cohort_id() returns uuid`
- Produces: `supabase/tests/client.ts`의 `serviceClient()`, `anonClient()`

- [ ] **Step 1: 로컬 Supabase 시작**

```bash
supabase init
supabase start
```

`supabase status` 출력의 `API URL`, `anon key`, `service_role key`를 `.env.test`에 적는다:

```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_KEY=<service_role key>
```

- [ ] **Step 2: DB 테스트 설정과 클라이언트**

`vitest.db.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['supabase/tests/**/*.test.ts'],
    setupFiles: ['dotenv/config'],
    testTimeout: 20000,
    fileParallelism: false,
  },
})
```

```bash
npm i -D dotenv
```

`package.json`의 `scripts`에 추가:

```json
{ "test:db": "supabase db reset && DOTENV_CONFIG_PATH=.env.test vitest run --config vitest.db.config.ts" }
```

`supabase/tests/client.ts`:

```ts
import { createClient } from '@supabase/supabase-js'

export const serviceClient = () =>
  createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } })

export const anonClient = () =>
  createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
```

- [ ] **Step 3: 실패하는 테스트 작성**

`supabase/tests/schema.test.ts`:

```ts
import { expect, test } from 'vitest'
import { serviceClient } from './client'

test('메뉴판 그대로 19개가 세 카테고리로 들어간다', async () => {
  const { data, error } = await serviceClient().from('menus_v2').select('category, name, price, ice_price_delta')
  expect(error).toBeNull()
  expect(data!).toHaveLength(19)
  expect(new Set(data!.map((m) => m.category))).toEqual(new Set(['coffee', 'non_coffee', 'cold']))
})

test('아메리카노는 1000원이고 ICE 는 1000원을 더 받는다', async () => {
  const { data } = await serviceClient().from('menus_v2').select('price, ice_price_delta').eq('name', '아메리카노').single()
  expect(data!.price).toBe(1000)
  expect(data!.ice_price_delta).toBe(1000)
})

test('COLD DRINKS 는 ICE 추가금이 없다', async () => {
  const { data } = await serviceClient().from('menus_v2').select('ice_price_delta').eq('category', 'cold')
  expect(data!.every((m) => m.ice_price_delta === 0)).toBe(true)
})

test('기본 주문 시간대는 주일 10:00-14:30 이다', async () => {
  const { data } = await serviceClient().from('cafe_settings_v2').select('*').single()
  expect(data!.weekday).toBe(7)
  expect(data!.opens_at).toBe('10:00:00')
  expect(data!.closes_at).toBe('14:30:00')
})
```

- [ ] **Step 4: 테스트 실패 확인**

Run: `npm run test:db`
Expected: FAIL — `relation "public.menus_v2" does not exist`

- [ ] **Step 5: 마이그레이션 작성**

`supabase/migrations/0001_core.sql`:

```sql
create type public.menu_category as enum ('coffee', 'non_coffee', 'cold');
create type public.order_item_status as enum ('ordered', 'cancelled');
create type public.app_role as enum ('admin', 'pastor', 'staff', 'youth');

create table public.cohorts_v2 (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  year int not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index cohorts_v2_one_active on public.cohorts_v2 (is_active) where is_active;

create table public.profiles_v2 (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  gender text,
  birth_date date,
  phone text,
  show_gender boolean not null default false,
  show_birth_date boolean not null default false,
  show_phone boolean not null default false,
  role public.app_role not null default 'youth',
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.menus_v2 (
  id uuid primary key default gen_random_uuid(),
  category public.menu_category not null,
  name text not null,
  price int not null default 0,
  ice_price_delta int not null default 0,
  options jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order int not null default 0
);

create table public.cafe_settings_v2 (
  id boolean primary key default true check (id),
  weekday int not null check (weekday between 1 and 7),
  opens_at time not null,
  closes_at time not null
);

create table public.cafe_closures_v2 (
  closed_on date primary key,
  reason text
);

create table public.orders_v2 (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid references public.cohorts_v2 on delete set null,
  profile_id uuid references public.profiles_v2 on delete cascade,
  guest_token uuid,
  service_date date not null,
  created_at timestamptz not null default now(),
  constraint orders_v2_owner check (num_nonnulls(profile_id, guest_token) = 1)
);
create index orders_v2_guest_token_idx on public.orders_v2 (guest_token) where guest_token is not null;

create table public.order_items_v2 (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders_v2 on delete cascade,
  menu_id uuid references public.menus_v2 on delete set null,
  menu_name text not null,
  option_label text not null default '',
  options jsonb not null default '{}'::jsonb,
  quantity int not null default 1 check (quantity between 1 and 9),
  status public.order_item_status not null default 'ordered',
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);
create index order_items_v2_order_idx on public.order_items_v2 (order_id);

create function public.active_cohort_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.cohorts_v2 where is_active limit 1;
$$;
```

`supabase/seed.sql`:

```sql
insert into public.cohorts_v2 (name, year, is_active) values ('3기', 2026, true);

insert into public.cafe_settings_v2 (weekday, opens_at, closes_at) values (7, '10:00', '14:30');

-- 2025 한신교회 DRINKS MENU 그대로. ICE 는 커피·논커피에서 +1,000, COLD DRINKS 는 ICE 전용이라 추가금이 없다.
insert into public.menus_v2 (category, name, price, ice_price_delta, options, sort_order) values
  ('coffee', '아메리카노', 1000, 1000, '{"temperature":["hot","ice"],"shot":2,"light":true,"syrup":true}', 1),
  ('coffee', '카페라떼', 2000, 1000, '{"temperature":["hot","ice"],"shot":2,"light":true,"syrup":true}', 2),
  ('coffee', '카푸치노', 2000, 1000, '{"temperature":["hot","ice"],"shot":2,"light":true,"syrup":true}', 3),
  ('coffee', '바닐라라떼', 2000, 1000, '{"temperature":["hot","ice"],"shot":2,"light":true,"syrup":true}', 4),
  ('coffee', '카페모카', 2000, 1000, '{"temperature":["hot","ice"],"shot":2,"light":true,"syrup":true}', 5),
  ('coffee', '카라멜 마끼아또', 2000, 1000, '{"temperature":["hot","ice"],"shot":2,"light":true,"syrup":true}', 6),
  ('non_coffee', '초코라떼', 2000, 1000, '{"temperature":["hot","ice"],"shot":0,"light":true,"syrup":false}', 1),
  ('non_coffee', '녹차라떼', 2000, 1000, '{"temperature":["hot","ice"],"shot":0,"light":true,"syrup":false}', 2),
  ('non_coffee', '단호박라떼', 2000, 1000, '{"temperature":["hot","ice"],"shot":0,"light":true,"syrup":false}', 3),
  ('non_coffee', '유자차', 2000, 1000, '{"temperature":["hot","ice"],"shot":0,"light":true,"syrup":false}', 4),
  ('non_coffee', '생강차', 2000, 1000, '{"temperature":["hot","ice"],"shot":0,"light":true,"syrup":false}', 5),
  ('non_coffee', '자몽차', 2000, 1000, '{"temperature":["hot","ice"],"shot":0,"light":true,"syrup":false}', 6),
  ('non_coffee', '캐모마일', 2000, 1000, '{"temperature":["hot","ice"],"shot":0,"light":true,"syrup":false}', 7),
  ('non_coffee', '루이보스', 2000, 1000, '{"temperature":["hot","ice"],"shot":0,"light":true,"syrup":false}', 8),
  ('non_coffee', '녹차', 2000, 1000, '{"temperature":["hot","ice"],"shot":0,"light":true,"syrup":false}', 9),
  ('cold', '레몬 아이스티', 2000, 0, '{"temperature":["ice"],"shot":0,"light":false,"syrup":false}', 1),
  ('cold', '복숭아 아이스티', 2000, 0, '{"temperature":["ice"],"shot":0,"light":false,"syrup":false}', 2),
  ('cold', '아샷추', 2000, 0, '{"temperature":["ice"],"shot":0,"light":false,"syrup":false}', 3),
  ('cold', '카프리썬', 1000, 0, '{"temperature":["ice"],"shot":0,"light":false,"syrup":false}', 4);
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `npm run test:db`
Expected: PASS 4개

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "feat: Supabase 스키마 1차와 시드"
```

---

### Task 5: RLS와 가격 비노출

**Files:**
- Create: `supabase/migrations/0002_rls.sql`
- Test: `supabase/tests/rls.test.ts`

**Interfaces:**
- Consumes: Task 4의 테이블
- Produces: 뷰 `public.menus_public_v2(id, category, name, options, sort_order)`, 헬퍼 `public.is_admin_or_staff() returns boolean`

- [ ] **Step 1: 실패하는 테스트 작성**

`supabase/tests/rls.test.ts`:

```ts
import { expect, test } from 'vitest'
import { anonClient, serviceClient } from './client'

test('게스트는 menus 테이블을 읽지 못한다', async () => {
  const { data } = await anonClient().from('menus_v2').select('id, price')
  expect(data ?? []).toHaveLength(0)
})

test('게스트는 menus_public 으로 메뉴를 읽고 가격 컬럼은 없다', async () => {
  const { data, error } = await anonClient().from('menus_public_v2').select('*')
  expect(error).toBeNull()
  expect(data!).toHaveLength(19)
  expect(Object.keys(data![0])).not.toContain('price')
  expect(Object.keys(data![0])).not.toContain('ice_price_delta')
})

test('게스트는 실제로 존재하는 주문도 직접 읽지 못한다', async () => {
  const db = serviceClient()
  const { data: order } = await db
    .from('orders_v2')
    .insert({ guest_token: '99999999-9999-9999-9999-999999999999', service_date: '2026-08-30' })
    .select('id')
    .single()
  await db.from('order_items_v2').insert({
    order_id: order!.id,
    menu_name: '아메리카노',
    option_label: 'ICE · 1잔',
    quantity: 1,
  })

  // 테이블이 비어서 0행인지, RLS 가 막아서 0행인지 구분하려면 실제 행이 있어야 한다
  const { data: real } = await db.from('order_items_v2').select('id').eq('order_id', order!.id)
  expect(real).toHaveLength(1)

  const { data: items } = await anonClient().from('order_items_v2').select('id')
  expect(items ?? []).toHaveLength(0)
  const { data: orders } = await anonClient().from('orders_v2').select('id')
  expect(orders ?? []).toHaveLength(0)

  await db.from('orders_v2').delete().eq('id', order!.id)
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test:db -- rls`
Expected: FAIL — 두 번째 테스트가 `relation "public.menus_public_v2" does not exist`

- [ ] **Step 3: RLS 마이그레이션 작성**

`supabase/migrations/0002_rls.sql`:

```sql
alter table public.cohorts_v2       enable row level security;
alter table public.profiles_v2      enable row level security;
alter table public.menus_v2         enable row level security;
alter table public.cafe_settings_v2 enable row level security;
alter table public.cafe_closures_v2 enable row level security;
alter table public.orders_v2        enable row level security;
alter table public.order_items_v2   enable row level security;

create function public.is_admin_or_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles_v2
    where id = auth.uid() and role in ('admin', 'pastor', 'staff')
  );
$$;

-- 가격이 없는 공개 뷰. 뷰 소유자 권한으로 읽으므로 menus 의 RLS 를 우회한다.
create view public.menus_public_v2 as
  select id, category, name, options, sort_order
  from public.menus_v2
  where is_active
  order by sort_order;

grant select on public.menus_public_v2 to anon, authenticated;

create policy "관리자만 메뉴 원본을 읽는다" on public.menus_v2
  for select to authenticated using (public.is_admin_or_staff());

create policy "주문 시간은 누구나 읽는다" on public.cafe_settings_v2
  for select to anon, authenticated using (true);

create policy "휴무일은 누구나 읽는다" on public.cafe_closures_v2
  for select to anon, authenticated using (true);

create policy "본인 주문만 읽는다" on public.orders_v2
  for select to authenticated using (profile_id = auth.uid());

create policy "본인 주문 항목만 읽는다" on public.order_items_v2
  for select to authenticated using (
    exists (select 1 from public.orders_v2 o where o.id = order_id and o.profile_id = auth.uid())
  );

create policy "본인 프로필만 읽는다" on public.profiles_v2
  for select to authenticated using (id = auth.uid() or public.is_admin_or_staff());

create policy "기수는 로그인 사용자가 읽는다" on public.cohorts_v2
  for select to authenticated using (true);
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test:db -- rls`
Expected: PASS 3개

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: RLS 적용과 가격 비노출 뷰"
```

---

### Task 6: 주문 시간 판정

**Files:**
- Create: `supabase/migrations/0003_order_window.sql`
- Test: `supabase/tests/order-window.test.ts`

**Interfaces:**
- Consumes: `cafe_settings`, `cafe_closures`
- Produces: `public.cafe_is_open(at timestamptz default now()) returns boolean`, `public.cafe_status() returns jsonb` — `{is_open, opens_at, closes_at, closes_in_seconds, is_closed_today, today_isodow, server_time}`

- [ ] **Step 1: 실패하는 테스트 작성**

`supabase/tests/order-window.test.ts`:

```ts
import { afterEach, beforeEach, expect, test } from 'vitest'
import { anonClient, serviceClient } from './client'

async function todayIsodow(): Promise<number> {
  const { data } = await anonClient().rpc('cafe_status')
  return data.today_isodow
}

beforeEach(async () => {
  await serviceClient().from('cafe_closures_v2').delete().gte('closed_on', '1900-01-01')
})
afterEach(async () => {
  // 이 파일은 공유 설정 행을 바꾼다. 원래 값으로 되돌려야 뒤에 도는 schema.test.ts 의 시드 단언이 깨지지 않는다.
  const db = serviceClient()
  await db.from('cafe_settings_v2').update({ weekday: 7, opens_at: '10:00', closes_at: '14:30' }).eq('id', true)
  await db.from('cafe_closures_v2').delete().gte('closed_on', '1900-01-01')
})


test('설정된 요일과 시간 안이면 열려 있다', async () => {
  const isodow = await todayIsodow()
  await serviceClient().from('cafe_settings_v2').update({ weekday: isodow, opens_at: '00:00', closes_at: '23:59' }).eq('id', true)
  const { data } = await anonClient().rpc('cafe_status')
  expect(data.is_open).toBe(true)
})

test('다른 요일이면 닫혀 있다', async () => {
  const isodow = await todayIsodow()
  const other = isodow === 7 ? 1 : isodow + 1
  await serviceClient().from('cafe_settings_v2').update({ weekday: other, opens_at: '00:00', closes_at: '23:59' }).eq('id', true)
  const { data } = await anonClient().rpc('cafe_status')
  expect(data.is_open).toBe(false)
  // 요일 때문에 닫힌 것이지 휴무일 때문이 아니다
  expect(data.is_closed_today).toBe(false)
  // 닫혀 있으면 남은 시간은 0 이어야 한다
  expect(data.closes_in_seconds).toBe(0)
})

test('임시 휴무일이면 시간 안이어도 닫혀 있다', async () => {
  const isodow = await todayIsodow()
  await serviceClient().from('cafe_settings_v2').update({ weekday: isodow, opens_at: '00:00', closes_at: '23:59' }).eq('id', true)
  const { data: status } = await anonClient().rpc('cafe_status')
  await serviceClient().from('cafe_closures_v2').insert({ closed_on: String(status.server_time).slice(0, 10), reason: '수련회' })
  const { data } = await anonClient().rpc('cafe_status')
  expect(data.is_open).toBe(false)
  expect(data.is_closed_today).toBe(true)
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test:db -- order-window`
Expected: FAIL — `Could not find the function public.cafe_status`

- [ ] **Step 3: 구현**

`supabase/migrations/0003_order_window.sql`:

```sql
create or replace function public.cafe_is_open(at timestamptz default now())
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
      select 1 from public.cafe_settings_v2 s
      where s.weekday = extract(isodow from timezone('Asia/Seoul', at))::int
        and timezone('Asia/Seoul', at)::time >= s.opens_at
        and timezone('Asia/Seoul', at)::time < s.closes_at
    )
    and not exists (
      select 1 from public.cafe_closures_v2 c
      where c.closed_on = timezone('Asia/Seoul', at)::date
    );
$$;

create or replace function public.cafe_status()
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'is_open', public.cafe_is_open(),
    'opens_at', s.opens_at,
    'closes_at', s.closes_at,
    'server_time', timezone('Asia/Seoul', now()),
    'today_isodow', extract(isodow from timezone('Asia/Seoul', now()))::int,
    -- 열려 있을 때만 남은 시간을 센다. 화요일 오전처럼 안 여는 날에도 값을 내놓으면
    -- 이 필드를 그대로 쓰는 화면이 "마감까지 5시간"을 보여주게 된다.
    'closes_in_seconds', case
      when public.cafe_is_open() then greatest(0, extract(epoch from (s.closes_at - timezone('Asia/Seoul', now())::time))::int)
      else 0
    end,
    'is_closed_today', exists (
      select 1 from public.cafe_closures_v2 c where c.closed_on = timezone('Asia/Seoul', now())::date
    )
  )
  from public.cafe_settings_v2 s;
$$;

-- cafe_is_open 은 RPC 안에서만 쓴다. Supabase 는 PUBLIC 뿐 아니라 ALTER DEFAULT PRIVILEGES 로
-- anon·authenticated 에도 EXECUTE 를 직접 주므로, from public 만으로는 회수되지 않는다. 세 대상을 모두 적는다.
revoke execute on function public.cafe_is_open(timestamptz) from public, anon, authenticated;

grant execute on function public.cafe_status() to anon, authenticated;
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test:db -- order-window`
Expected: PASS 3개

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: 주문 가능 시간 판정 함수"
```

---

### Task 7: 주문 제출 RPC

**Files:**
- Create: `supabase/migrations/0004_place_order.sql`
- Test: `supabase/tests/place-order.test.ts`

**Interfaces:**
- Consumes: `cafe_is_open()`, `active_cohort_id()`, `menus`, `orders`, `order_items`
- Produces: `public.place_order(p_items jsonb, p_guest_token uuid default null) returns uuid`. `p_items`의 각 원소는 `{"menu_id": uuid, "option_label": text, "options": jsonb, "quantity": int}`. 오류 메시지: `ORDER_WINDOW_CLOSED`, `GUEST_TOKEN_REQUIRED`, `EMPTY_CART`, `MENU_NOT_FOUND`

- [ ] **Step 1: 실패하는 테스트 작성**

`supabase/tests/place-order.test.ts`:

```ts
import { afterEach, beforeEach, expect, test } from 'vitest'
import { anonClient, serviceClient } from './client'

const TOKEN = '11111111-1111-1111-1111-111111111111'

async function open() {
  const anon = anonClient()
  const { data } = await anon.rpc('cafe_status')
  await serviceClient().from('cafe_settings_v2')
    .update({ weekday: data.today_isodow, opens_at: '00:00', closes_at: '23:59' }).eq('id', true)
  await serviceClient().from('cafe_closures_v2').delete().gte('closed_on', '1900-01-01')
}

async function americano(): Promise<string> {
  const { data } = await serviceClient().from('menus_v2').select('id').eq('name', '아메리카노').single()
  return data!.id
}

beforeEach(open)
afterEach(async () => {
  // 이 파일은 공유 설정 행을 바꾼다. 원래 값으로 되돌려야 뒤에 도는 schema.test.ts 의 시드 단언이 깨지지 않는다.
  const db = serviceClient()
  await db.from('cafe_settings_v2').update({ weekday: 7, opens_at: '10:00', closes_at: '14:30' }).eq('id', true)
  await db.from('cafe_closures_v2').delete().gte('closed_on', '1900-01-01')
})


test('열려 있으면 주문과 항목이 만들어지고 메뉴명이 스냅샷으로 남는다', async () => {
  const menuId = await americano()
  const { data: orderId, error } = await anonClient().rpc('place_order', {
    p_items: [{ menu_id: menuId, option_label: 'ICE · 샷 1', options: { temperature: 'ice', shot: 1 }, quantity: 2 }],
    p_guest_token: TOKEN,
  })
  expect(error).toBeNull()

  const { data: items } = await serviceClient().from('order_items_v2').select('*').eq('order_id', orderId)
  expect(items).toHaveLength(1)
  expect(items![0].menu_name).toBe('아메리카노')
  expect(items![0].option_label).toBe('ICE · 샷 1')
  expect(items![0].quantity).toBe(2)
  expect(items![0].status).toBe('ordered')
})

test('마감 뒤에는 주문하지 못한다', async () => {
  const menuId = await americano()
  await serviceClient().from('cafe_settings_v2').update({ opens_at: '00:00', closes_at: '00:01' }).eq('id', true)
  const { error } = await anonClient().rpc('place_order', {
    p_items: [{ menu_id: menuId, option_label: 'ICE', options: {}, quantity: 1 }],
    p_guest_token: TOKEN,
  })
  expect(error?.message).toContain('ORDER_WINDOW_CLOSED')
})

test('게스트 토큰이 없으면 거절한다', async () => {
  const menuId = await americano()
  const { error } = await anonClient().rpc('place_order', {
    p_items: [{ menu_id: menuId, option_label: 'ICE', options: {}, quantity: 1 }],
  })
  expect(error?.message).toContain('GUEST_TOKEN_REQUIRED')
})

test('빈 장바구니는 거절한다', async () => {
  const { error } = await anonClient().rpc('place_order', { p_items: [], p_guest_token: TOKEN })
  expect(error?.message).toContain('EMPTY_CART')
})

test('없는 메뉴를 담으면 거절한다', async () => {
  const { error } = await anonClient().rpc('place_order', {
    p_items: [{ menu_id: '00000000-0000-0000-0000-000000000000', option_label: 'ICE', options: {}, quantity: 1 }],
    p_guest_token: TOKEN,
  })
  expect(error?.message).toContain('MENU_NOT_FOUND')
})

test('숨긴 메뉴는 주문하지 못한다', async () => {
  const db = serviceClient()
  const { data: hidden } = await db
    .from('menus_v2')
    .insert({
      category: 'coffee',
      name: '숨긴 메뉴',
      price: 2000,
      ice_price_delta: 1000,
      options: { temperature: ['hot'], shot: 0, light: false, syrup: false },
      sort_order: 98,
      is_active: false,
    })
    .select('id')
    .single()

  const { error } = await anonClient().rpc('place_order', {
    p_items: [{ menu_id: hidden!.id, option_label: 'HOT', options: {}, quantity: 1 }],
    p_guest_token: TOKEN,
  })
  expect(error?.message).toContain('MENU_NOT_FOUND')

  await db.from('menus_v2').delete().eq('id', hidden!.id)
})

test('수량은 1에서 9 사이로 맞춰진다', async () => {
  const menuId = await americano()
  const { data: orderId } = await anonClient().rpc('place_order', {
    p_items: [
      { menu_id: menuId, option_label: 'ICE', options: {}, quantity: 0 },
      { menu_id: menuId, option_label: 'HOT', options: {}, quantity: 99 },
    ],
    p_guest_token: TOKEN,
  })

  const { data: items } = await serviceClient()
    .from('order_items_v2')
    .select('option_label, quantity')
    .eq('order_id', orderId)
    .order('option_label')

  expect(items!.map((i) => [i.option_label, i.quantity])).toEqual([
    ['HOT', 9],
    ['ICE', 1],
  ])
})

test('메뉴를 지워도 주문 내역은 주문 당시 이름과 옵션으로 남는다', async () => {
  const db = serviceClient()
  const { data: temp } = await db
    .from('menus_v2')
    .insert({
      category: 'coffee',
      name: '한정 메뉴',
      price: 2000,
      ice_price_delta: 1000,
      options: { temperature: ['hot'], shot: 0, light: false, syrup: false },
      sort_order: 99,
    })
    .select('id')
    .single()

  const { data: orderId } = await anonClient().rpc('place_order', {
    p_items: [{ menu_id: temp!.id, option_label: 'HOT · 1잔', options: { temperature: 'hot' }, quantity: 1 }],
    p_guest_token: TOKEN,
  })

  await db.from('menus_v2').delete().eq('id', temp!.id)

  const { data: items } = await db
    .from('order_items_v2')
    .select('menu_id, menu_name, option_label')
    .eq('order_id', orderId)

  expect(items![0].menu_id).toBeNull()
  expect(items![0].menu_name).toBe('한정 메뉴')
  expect(items![0].option_label).toBe('HOT · 1잔')
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test:db -- place-order`
Expected: FAIL — `Could not find the function public.place_order`

- [ ] **Step 3: 구현**

`supabase/migrations/0004_place_order.sql`:

```sql
create or replace function public.place_order(p_items jsonb, p_guest_token uuid default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_menu public.menus_v2%rowtype;
begin
  if not public.cafe_is_open() then
    raise exception 'ORDER_WINDOW_CLOSED';
  end if;
  if auth.uid() is null and p_guest_token is null then
    raise exception 'GUEST_TOKEN_REQUIRED';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;

  insert into public.orders_v2 (cohort_id, profile_id, guest_token, service_date)
  values (
    public.active_cohort_id(),
    auth.uid(),
    case when auth.uid() is null then p_guest_token end,
    timezone('Asia/Seoul', now())::date
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_menu from public.menus_v2 where id = (v_item->>'menu_id')::uuid and is_active;
    if not found then
      raise exception 'MENU_NOT_FOUND';
    end if;

    insert into public.order_items_v2 (order_id, menu_id, menu_name, option_label, options, quantity)
    values (
      v_order_id,
      v_menu.id,
      v_menu.name,
      coalesce(v_item->>'option_label', ''),
      coalesce(v_item->'options', '{}'::jsonb),
      least(9, greatest(1, coalesce((v_item->>'quantity')::int, 1)))
    );
  end loop;

  return v_order_id;
end $$;

grant execute on function public.place_order(jsonb, uuid) to anon, authenticated;
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test:db -- place-order`
Expected: PASS 8개

마지막 테스트는 시드된 19행을 건드리지 않도록 임시 메뉴를 새로 만들어 지운다. `db reset` 은 스위트 전체에 한 번만 돌기 때문이다.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: 주문 제출 RPC"
```

---

### Task 8: 게스트 조회와 취소 RPC

**Files:**
- Create: `supabase/migrations/0005_guest_orders.sql`
- Test: `supabase/tests/guest-orders.test.ts`

**Interfaces:**
- Consumes: Task 7의 `place_order`
- Produces:
  - `public.get_guest_orders(p_guest_token uuid) returns table (item_id uuid, menu_name text, option_label text, quantity int, status public.order_item_status, ordered_at timestamptz)`
  - `public.cancel_order_item(p_item_id uuid, p_guest_token uuid default null) returns void`. 오류: `ORDER_WINDOW_CLOSED`, `NOT_YOUR_ORDER`

- [ ] **Step 1: 실패하는 테스트 작성**

`supabase/tests/guest-orders.test.ts`:

```ts
import { afterEach, beforeEach, expect, test } from 'vitest'
import { anonClient, serviceClient } from './client'

const MINE = '22222222-2222-2222-2222-222222222222'
const OTHER = '33333333-3333-3333-3333-333333333333'

async function open() {
  const { data } = await anonClient().rpc('cafe_status')
  await serviceClient().from('cafe_settings_v2')
    .update({ weekday: data.today_isodow, opens_at: '00:00', closes_at: '23:59' }).eq('id', true)
  await serviceClient().from('cafe_closures_v2').delete().gte('closed_on', '1900-01-01')
}

async function order(token: string) {
  const { data: menu } = await serviceClient().from('menus_v2').select('id').eq('name', '카페라떼').single()
  await anonClient().rpc('place_order', {
    p_items: [{ menu_id: menu!.id, option_label: 'ICE', options: {}, quantity: 1 }],
    p_guest_token: token,
  })
}

beforeEach(open)
afterEach(async () => {
  // 이 파일은 공유 설정 행을 바꾼다. 원래 값으로 되돌려야 뒤에 도는 schema.test.ts 의 시드 단언이 깨지지 않는다.
  const db = serviceClient()
  await db.from('cafe_settings_v2').update({ weekday: 7, opens_at: '10:00', closes_at: '14:30' }).eq('id', true)
  await db.from('cafe_closures_v2').delete().gte('closed_on', '1900-01-01')
})


test('자기 토큰의 오늘 주문만 본다', async () => {
  await order(MINE)
  await order(OTHER)
  const { data } = await anonClient().rpc('get_guest_orders', { p_guest_token: MINE })
  expect(data).toHaveLength(1)
  expect(data![0].menu_name).toBe('카페라떼')
})

test('남의 항목은 취소하지 못한다', async () => {
  await order(MINE)
  const { data } = await anonClient().rpc('get_guest_orders', { p_guest_token: MINE })
  const { error } = await anonClient().rpc('cancel_order_item', {
    p_item_id: data![0].item_id,
    p_guest_token: OTHER,
  })
  expect(error?.message).toContain('NOT_YOUR_ORDER')
})

test('자기 항목은 취소되고 상태가 바뀐다', async () => {
  await order(MINE)
  const { data } = await anonClient().rpc('get_guest_orders', { p_guest_token: MINE })
  const { error } = await anonClient().rpc('cancel_order_item', {
    p_item_id: data![0].item_id,
    p_guest_token: MINE,
  })
  expect(error).toBeNull()
  const { data: after } = await anonClient().rpc('get_guest_orders', { p_guest_token: MINE })
  expect(after![0].status).toBe('cancelled')
})

test('어제 주문은 보이지도 취소되지도 않는다', async () => {
  const db = serviceClient()
  const { data: menu } = await db.from('menus_v2').select('id').eq('name', '카페라떼').single()
  const { data: order } = await db
    .from('orders_v2')
    .insert({ guest_token: MINE, service_date: '2026-01-04' })
    .select('id')
    .single()
  const { data: item } = await db
    .from('order_items_v2')
    .insert({
      order_id: order!.id,
      menu_id: menu!.id,
      menu_name: '카페라떼',
      option_label: 'ICE',
      quantity: 1,
    })
    .select('id')
    .single()

  try {
    // service_date 가 오늘이 아니므로 목록에도, 취소에도 걸리지 않아야 한다
    const { data: listed } = await anonClient().rpc('get_guest_orders', { p_guest_token: MINE })
    expect((listed ?? []).some((i: { item_id: string }) => i.item_id === item!.id)).toBe(false)

    const { error } = await anonClient().rpc('cancel_order_item', {
      p_item_id: item!.id,
      p_guest_token: MINE,
    })
    expect(error?.message).toContain('NOT_YOUR_ORDER')
  } finally {
    await db.from('orders_v2').delete().eq('id', order!.id)
  }
})

test('토큰 없이 조회하면 아무것도 보이지 않는다', async () => {
  await order(MINE)
  const { data } = await anonClient().rpc('get_guest_orders', { p_guest_token: null })
  expect(data ?? []).toHaveLength(0)
})

test('마감 뒤에는 취소하지 못한다', async () => {
  await order(MINE)
  const { data } = await anonClient().rpc('get_guest_orders', { p_guest_token: MINE })
  await serviceClient().from('cafe_settings_v2').update({ opens_at: '00:00', closes_at: '00:01' }).eq('id', true)
  const { error } = await anonClient().rpc('cancel_order_item', {
    p_item_id: data![0].item_id,
    p_guest_token: MINE,
  })
  expect(error?.message).toContain('ORDER_WINDOW_CLOSED')
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test:db -- guest-orders`
Expected: FAIL — `Could not find the function public.get_guest_orders`

- [ ] **Step 3: 구현**

`supabase/migrations/0005_guest_orders.sql`:

```sql
create or replace function public.get_guest_orders(p_guest_token uuid)
returns table (
  item_id uuid,
  menu_name text,
  option_label text,
  quantity int,
  status public.order_item_status,
  ordered_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select i.id, i.menu_name, i.option_label, i.quantity, i.status, i.created_at
  from public.order_items_v2 i
  join public.orders_v2 o on o.id = i.order_id
  where o.guest_token = p_guest_token
    and o.service_date = timezone('Asia/Seoul', now())::date
  order by i.created_at;
$$;

create or replace function public.cancel_order_item(p_item_id uuid, p_guest_token uuid default null)
returns void
language plpgsql security definer set search_path = public as $$
declare v_owned boolean;
begin
  if not public.cafe_is_open() then
    raise exception 'ORDER_WINDOW_CLOSED';
  end if;

  select exists (
    select 1
    from public.order_items_v2 i
    join public.orders_v2 o on o.id = i.order_id
    where i.id = p_item_id
      and o.service_date = timezone('Asia/Seoul', now())::date
      and (
        (auth.uid() is not null and o.profile_id = auth.uid())
        or (p_guest_token is not null and o.guest_token = p_guest_token)
      )
  ) into v_owned;

  if not v_owned then
    raise exception 'NOT_YOUR_ORDER';
  end if;

  update public.order_items_v2
  set status = 'cancelled', cancelled_at = now()
  where id = p_item_id;
end $$;

grant execute on function public.get_guest_orders(uuid) to anon, authenticated;
grant execute on function public.cancel_order_item(uuid, uuid) to anon, authenticated;
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test:db -- guest-orders`
Expected: PASS 6개

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: 게스트 주문 조회와 취소 RPC"
```

---

### Task 9: 클라이언트 기반과 API 계층

**Files:**
- Create: `src/lib/supabase.ts`, `src/lib/guestToken.ts`, `src/features/cafe/api.ts`, `.env.local.example`
- Modify: `src/main.tsx`
- Test: `src/lib/guestToken.test.ts`

**Interfaces:**
- Consumes: Task 5~8의 뷰와 RPC
- Produces:
  - `getGuestToken(): string`
  - 타입 `Menu`, `MenuOptions`, `CartLine`, `GuestOrderItem`, `CafeStatus`
  - `fetchMenus(): Promise<Menu[]>`, `fetchCafeStatus(): Promise<CafeStatus>`, `placeOrder(items: CartLine[], guestToken: string): Promise<string>`, `fetchGuestOrders(guestToken: string): Promise<GuestOrderItem[]>`, `cancelOrderItem(itemId: string, guestToken: string): Promise<void>`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/guestToken.test.ts`:

```ts
import { beforeEach, expect, test } from 'vitest'
import { getGuestToken } from './guestToken'

beforeEach(() => localStorage.clear())

test('한 번 발급한 토큰을 계속 쓴다', () => {
  const first = getGuestToken()
  expect(getGuestToken()).toBe(first)
  expect(localStorage.getItem('yh.guestToken')).toBe(first)
})

test('UUID 형식이다', () => {
  expect(getGuestToken()).toMatch(/^[0-9a-f-]{36}$/)
})

test('저장소가 막혀 있어도 세션 동안 쓸 토큰을 준다', () => {
  const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('SecurityError')
  })
  try {
    const first = getGuestToken()
    expect(first).toMatch(/^[0-9a-f-]{36}$/)
    expect(getGuestToken()).toBe(first)
  } finally {
    spy.mockRestore()
  }
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test src/lib/guestToken.test.ts`
Expected: FAIL — `Failed to resolve import "./guestToken"`

- [ ] **Step 3: 구현**

`src/lib/guestToken.ts`:

```ts
const KEY = 'yh.guestToken'

// 시크릿 모드나 저장소가 막힌 브라우저에서는 localStorage 접근 자체가 예외를 던진다.
// 게스트 주문은 이 앱의 전부이므로, 그때도 이 세션 동안 쓸 토큰으로 물러선다.
// 새로고침하면 지난 주문을 못 보지만, 주문 자체는 된다.
let memoryToken = ''

export function getGuestToken(): string {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved) return saved
    const token = crypto.randomUUID()
    localStorage.setItem(KEY, token)
    return token
  } catch {
    if (!memoryToken) memoryToken = crypto.randomUUID()
    return memoryToken
  }
}
```

`src/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
)
```

`.env.local.example`:

```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=
```

`src/features/cafe/api.ts`:

```ts
import { supabase } from '../../lib/supabase'

export type MenuCategory = 'coffee' | 'non_coffee' | 'cold'
export type MenuOptions = { temperature: ('ice' | 'hot')[]; shot: number; light: boolean; syrup: boolean }
export type Menu = { id: string; category: MenuCategory; name: string; options: MenuOptions; sort_order: number }

export type CartLine = {
  menu_id: string
  menu_name: string
  option_label: string
  options: { temperature: 'ice' | 'hot'; shot: number; light: boolean; syrup: boolean }
  quantity: number
}

export type GuestOrderItem = {
  item_id: string
  menu_name: string
  option_label: string
  quantity: number
  status: 'ordered' | 'cancelled'
  ordered_at: string
}

export type CafeStatus = {
  is_open: boolean
  opens_at: string
  closes_at: string
  closes_in_seconds: number
  is_closed_today: boolean
  today_isodow: number
  server_time: string
}

export async function fetchMenus(): Promise<Menu[]> {
  const { data, error } = await supabase.from('menus_public_v2').select('*')
  if (error) throw error
  return data as Menu[]
}

export async function fetchCafeStatus(): Promise<CafeStatus> {
  const { data, error } = await supabase.rpc('cafe_status')
  if (error) throw error
  return data as CafeStatus
}

export async function placeOrder(items: CartLine[], guestToken: string): Promise<string> {
  const { data, error } = await supabase.rpc('place_order', { p_items: items, p_guest_token: guestToken })
  if (error) throw error
  return data as string
}

export async function fetchGuestOrders(guestToken: string): Promise<GuestOrderItem[]> {
  const { data, error } = await supabase.rpc('get_guest_orders', { p_guest_token: guestToken })
  if (error) throw error
  return (data ?? []) as GuestOrderItem[]
}

export async function cancelOrderItem(itemId: string, guestToken: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_order_item', { p_item_id: itemId, p_guest_token: guestToken })
  if (error) throw error
}
```

`src/main.tsx`에 QueryClientProvider 추가:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } })
```

`<App />`을 `<QueryClientProvider client={queryClient}>`로 감싼다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test src/lib/guestToken.test.ts`
Expected: PASS 3개

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: Supabase 클라이언트, 게스트 토큰, API 계층"
```

---

### Task 10: 메뉴 목록과 카테고리 탭

**Files:**
- Create: `src/features/cafe/CategoryTabs.tsx`, `src/features/cafe/CategoryTabs.module.css`, `src/features/cafe/MenuGrid.tsx`, `src/features/cafe/MenuGrid.module.css`, `src/test/renderWithQuery.tsx`
- Test: `src/features/cafe/MenuGrid.test.tsx`

**Interfaces:**
- Consumes: `fetchMenus`, `Menu`
- Produces: `CategoryTabs(props: { value: MenuCategory; onChange: (c: MenuCategory) => void })`, `MenuGrid(props: { menus: Menu[]; counts: Record<string, number>; onPick: (menu: Menu) => void })`, `renderWithQuery(ui: ReactElement)`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/features/cafe/MenuGrid.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MenuGrid } from './MenuGrid'
import type { Menu } from './api'

const menus: Menu[] = [
  { id: 'm1', category: 'coffee', name: '아메리카노', sort_order: 1, options: { temperature: ['ice', 'hot'], shot: 2, light: true, syrup: false } },
  { id: 'm2', category: 'coffee', name: '카페라떼', sort_order: 2, options: { temperature: ['ice', 'hot'], shot: 2, light: true, syrup: false } },
]

test('메뉴 이름과 담긴 수량을 보여준다', () => {
  render(<MenuGrid menus={menus} counts={{ m2: 2 }} onPick={() => {}} />)
  expect(screen.getByRole('button', { name: /아메리카노/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /카페라떼 2개 담김/ })).toBeInTheDocument()
})

test('가격을 화면에 내보내지 않는다', () => {
  const { container } = render(<MenuGrid menus={menus} counts={{}} onPick={() => {}} />)
  expect(container.textContent).not.toMatch(/원|\d{3,}/)
})

test('메뉴를 누르면 onPick 에 그 메뉴를 넘긴다', async () => {
  const onPick = vi.fn()
  render(<MenuGrid menus={menus} counts={{}} onPick={onPick} />)
  await userEvent.click(screen.getByRole('button', { name: /아메리카노/ }))
  expect(onPick).toHaveBeenCalledWith(menus[0])
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test src/features/cafe/MenuGrid.test.tsx`
Expected: FAIL — `Failed to resolve import "./MenuGrid"`

- [ ] **Step 3: 구현**

`src/features/cafe/MenuGrid.module.css`:

```css
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-3); }
@media (min-width: 600px) { .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (min-width: 1024px) { .grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.card { display: flex; flex-direction: column; gap: var(--space-2); align-items: flex-start; min-height: 132px; padding: var(--space-4); border-radius: var(--radius-card); background: var(--surface); text-align: left; }
.picked { background: var(--accent-fill); color: #171310; }
.name { font-size: var(--text-body); font-weight: 600; }
.opt { font-size: var(--text-micro); color: var(--text-muted); }
.count { margin-left: auto; font-family: var(--font-mono); font-size: var(--text-micro); background: var(--text); color: var(--surface); padding: 2px 8px; border-radius: var(--radius-pill); }
```

`src/features/cafe/MenuGrid.tsx`:

```tsx
import type { Menu } from './api'
import styles from './MenuGrid.module.css'

function optionSummary(menu: Menu): string {
  const parts = menu.options.temperature.map((t) => t.toUpperCase())
  if (menu.options.shot > 0) parts.push('샷 추가')
  if (menu.options.light) parts.push('연하게')
  if (menu.options.syrup) parts.push('시럽 추가')
  return parts.join(' · ')
}

export function MenuGrid({
  menus,
  counts,
  onPick,
}: {
  menus: Menu[]
  counts: Record<string, number>
  onPick: (menu: Menu) => void
}) {
  return (
    <div className={styles.grid}>
      {menus.map((menu) => {
        const count = counts[menu.id] ?? 0
        const label = count > 0 ? `${menu.name} ${count}개 담김` : menu.name
        return (
          <button
            key={menu.id}
            type="button"
            aria-label={label}
            className={`${styles.card} ${count > 0 ? styles.picked : ''}`}
            onClick={() => onPick(menu)}
          >
            {count > 0 && <span className={styles.count}>{count}</span>}
            <span className={styles.name}>{menu.name}</span>
            <span className={styles.opt}>{optionSummary(menu)}</span>
          </button>
        )
      })}
    </div>
  )
}
```

`src/features/cafe/CategoryTabs.module.css`:

```css
.track { display: flex; gap: var(--space-1); padding: var(--space-1); background: var(--fill); border-radius: var(--radius-field); }
.tab { flex: 1; height: var(--control); border-radius: 9px; font-size: var(--text-label); font-weight: 500; color: var(--text-muted); }
.on { background: var(--surface); color: var(--text); }
```

`src/features/cafe/CategoryTabs.tsx`:

```tsx
import type { MenuCategory } from './api'
import styles from './CategoryTabs.module.css'

const TABS: { id: MenuCategory; label: string }[] = [
  { id: 'coffee', label: '커피' },
  { id: 'non_coffee', label: '논커피' },
  { id: 'cold', label: '음료' },
]

export function CategoryTabs({ value, onChange }: { value: MenuCategory; onChange: (c: MenuCategory) => void }) {
  return (
    <div className={styles.track} role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          className={`${styles.tab} ${value === tab.id ? styles.on : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
```

`src/test/renderWithQuery.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'

export function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test src/features/cafe/MenuGrid.test.tsx`
Expected: PASS 3개

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: 메뉴 목록과 카테고리 탭"
```

---

### Task 11: 옵션 선택과 장바구니

**Files:**
- Create: `src/features/cafe/optionLabel.ts`, `src/features/cafe/useCart.ts`, `src/features/cafe/OptionSheet.tsx`, `src/features/cafe/OptionSheet.module.css`
- Test: `src/features/cafe/optionLabel.test.ts`, `src/features/cafe/OptionSheet.test.tsx`

**Interfaces:**
- Consumes: `Menu`, `CartLine`, `Chip`, `Stepper`, `Button`
- Produces:
  - `type Selection = { temperature: 'ice' | 'hot'; shot: number; light: boolean; syrup: boolean; quantity: number }`
  - `buildOptionLabel(s: Selection): string`
  - `useCart(): { lines: CartLine[]; counts: Record<string, number>; total: number; add: (line: CartLine) => void; removeLast: () => void; clear: () => void }`
  - `OptionSheet(props: { menu: Menu; onClose: () => void; onAdd: (line: CartLine) => void })`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/features/cafe/optionLabel.test.ts`:

```ts
import { expect, test } from 'vitest'
import { buildOptionLabel } from './optionLabel'

test('고른 옵션만 순서대로 잇는다', () => {
  expect(buildOptionLabel({ temperature: 'ice', shot: 1, light: true, syrup: false, quantity: 2 }))
    .toBe('ICE · 샷 1 · 연하게 · 2잔')
})

test('고르지 않은 옵션은 빼고 온도와 수량은 항상 넣는다', () => {
  expect(buildOptionLabel({ temperature: 'hot', shot: 0, light: false, syrup: false, quantity: 1 }))
    .toBe('HOT · 1잔')
})
```

`src/features/cafe/OptionSheet.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OptionSheet } from './OptionSheet'
import type { Menu } from './api'

const menu: Menu = {
  id: 'm1', category: 'coffee', name: '아메리카노', sort_order: 1,
  options: { temperature: ['ice', 'hot'], shot: 2, light: true, syrup: false },
}

test('메뉴가 쓰지 않는 옵션은 보여주지 않는다', () => {
  render(<OptionSheet menu={menu} onClose={() => {}} onAdd={() => {}} />)
  expect(screen.getByRole('button', { name: 'ICE' })).toBeInTheDocument()
  expect(screen.queryByText('시럽 추가')).not.toBeInTheDocument()
})

test('고른 옵션으로 장바구니 줄을 만든다', async () => {
  const onAdd = vi.fn()
  render(<OptionSheet menu={menu} onClose={() => {}} onAdd={onAdd} />)
  await userEvent.click(screen.getByRole('button', { name: 'HOT' }))
  await userEvent.click(screen.getByRole('button', { name: '수량 늘리기' }))
  await userEvent.click(screen.getByRole('button', { name: '장바구니에 담기' }))

  expect(onAdd).toHaveBeenCalledWith({
    menu_id: 'm1',
    menu_name: '아메리카노',
    option_label: 'HOT · 2잔',
    options: { temperature: 'hot', shot: 0, light: false, syrup: false },
    quantity: 2,
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test src/features/cafe`
Expected: FAIL — `Failed to resolve import "./optionLabel"`

- [ ] **Step 3: 구현**

`src/features/cafe/optionLabel.ts`:

```ts
export type Selection = { temperature: 'ice' | 'hot'; shot: number; light: boolean; syrup: boolean; quantity: number }

export function buildOptionLabel(s: Selection): string {
  const parts: string[] = [s.temperature.toUpperCase()]
  if (s.shot > 0) parts.push(`샷 ${s.shot}`)
  if (s.light) parts.push('연하게')
  if (s.syrup) parts.push('시럽')
  parts.push(`${s.quantity}잔`)
  return parts.join(' · ')
}
```

`src/features/cafe/useCart.ts`:

```ts
import { useCallback, useMemo, useState } from 'react'
import type { CartLine } from './api'

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([])

  const add = useCallback((line: CartLine) => setLines((prev) => [...prev, line]), [])
  const removeLast = useCallback(() => setLines((prev) => prev.slice(0, -1)), [])
  const clear = useCallback(() => setLines([]), [])

  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const line of lines) map[line.menu_id] = (map[line.menu_id] ?? 0) + line.quantity
    return map
  }, [lines])

  const total = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines])

  return { lines, counts, total, add, removeLast, clear }
}
```

`src/features/cafe/OptionSheet.tsx`:

```tsx
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { Stepper } from '../../components/ui/Stepper'
import type { CartLine, Menu } from './api'
import { buildOptionLabel, type Selection } from './optionLabel'
import styles from './OptionSheet.module.css'

export function OptionSheet({ menu, onClose, onAdd }: { menu: Menu; onClose: () => void; onAdd: (line: CartLine) => void }) {
  const [selection, setSelection] = useState<Selection>({
    temperature: menu.options.temperature[0],
    shot: 0,
    light: false,
    syrup: false,
    quantity: 1,
  })

  const submit = () => {
    onAdd({
      menu_id: menu.id,
      menu_name: menu.name,
      option_label: buildOptionLabel(selection),
      options: {
        temperature: selection.temperature,
        shot: selection.shot,
        light: selection.light,
        syrup: selection.syrup,
      },
      quantity: selection.quantity,
    })
    onClose()
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} role="dialog" aria-label={`${menu.name} 옵션`} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{menu.name}</h2>

        <div className={styles.row}>
          <span className={styles.label}>온도</span>
          <div className={styles.chips}>
            {menu.options.temperature.map((t) => (
              <Chip
                key={t}
                selected={selection.temperature === t}
                onClick={() => setSelection((s) => ({ ...s, temperature: t }))}
              >
                {t.toUpperCase()}
              </Chip>
            ))}
          </div>
        </div>

        {menu.options.shot > 0 && (
          <div className={styles.row}>
            <span className={styles.label}>샷 추가</span>
            <Stepper
              label="샷"
              value={selection.shot}
              min={0}
              max={menu.options.shot}
              onChange={(shot) => setSelection((s) => ({ ...s, shot }))}
            />
          </div>
        )}

        {menu.options.light && (
          <label className={styles.row}>
            <span className={styles.label}>연하게</span>
            <input
              type="checkbox"
              checked={selection.light}
              onChange={(e) => setSelection((s) => ({ ...s, light: e.target.checked }))}
            />
          </label>
        )}

        {menu.options.syrup && (
          <label className={styles.row}>
            <span className={styles.label}>시럽 추가</span>
            <input
              type="checkbox"
              checked={selection.syrup}
              onChange={(e) => setSelection((s) => ({ ...s, syrup: e.target.checked }))}
            />
          </label>
        )}

        <div className={styles.row}>
          <span className={styles.label}>수량</span>
          <Stepper
            label="수량"
            value={selection.quantity}
            min={1}
            max={9}
            onChange={(quantity) => setSelection((s) => ({ ...s, quantity }))}
          />
        </div>

        <p className={styles.summary}>{buildOptionLabel(selection)}</p>
        <Button size="lg" onClick={submit}>장바구니에 담기</Button>
      </div>
    </div>
  )
}
```

`src/features/cafe/OptionSheet.module.css`:

```css
.backdrop { position: fixed; inset: 0; background: rgba(23, 19, 16, 0.32); display: flex; align-items: flex-end; justify-content: center; }
.sheet { width: 100%; max-width: 480px; background: var(--surface); border-radius: var(--radius-sheet) var(--radius-sheet) 0 0; padding: var(--space-4) var(--space-5) var(--space-5); display: flex; flex-direction: column; gap: var(--space-4); }
@media (min-width: 1024px) { .backdrop { align-items: center; } .sheet { border-radius: var(--radius-sheet); } }
.title { font-size: var(--text-title-lg); font-weight: 600; letter-spacing: -0.02em; margin: 0; }
.row { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); min-height: var(--control); }
.label { font-size: var(--text-label); font-weight: 500; }
.chips { display: flex; gap: var(--space-2); }
.summary { margin: 0; padding: var(--space-3) var(--space-4); border-radius: var(--radius-field); background: var(--fill); font-size: var(--text-caption); color: var(--text-2); }
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test src/features/cafe`
Expected: PASS 7개(Task 10의 3개 포함)

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: 옵션 선택 시트와 장바구니"
```

---

### Task 12: 주문 화면 조립과 제출

**Files:**
- Create: `src/features/cafe/useCafeStatus.ts`, `src/features/cafe/StatusBanner.tsx`, `src/features/cafe/StatusBanner.module.css`, `src/features/cafe/OrderPage.tsx`, `src/features/cafe/OrderPage.module.css`
- Modify: `src/App.tsx`
- Test: `src/features/cafe/OrderPage.test.tsx`

**Interfaces:**
- Consumes: Task 9~11 전부
- Produces: `useCafeStatus(): UseQueryResult<CafeStatus>`, `StatusBanner(props: { status?: CafeStatus })`, `OrderPage()`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/features/cafe/OrderPage.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithQuery } from '../../test/renderWithQuery'
import { OrderPage } from './OrderPage'
import * as api from './api'

vi.mock('./api')

const menu: api.Menu = {
  id: 'm1', category: 'coffee', name: '아메리카노', sort_order: 1,
  options: { temperature: ['ice', 'hot'], shot: 2, light: true, syrup: false },
}

const openStatus: api.CafeStatus = {
  is_open: true, opens_at: '10:00:00', closes_at: '14:30:00',
  closes_in_seconds: 3600, is_closed_today: false, today_isodow: 7, server_time: '2026-08-31T11:30:00',
}

beforeEach(() => {
  vi.mocked(api.fetchMenus).mockResolvedValue([menu])
  vi.mocked(api.fetchCafeStatus).mockResolvedValue(openStatus)
  vi.mocked(api.placeOrder).mockResolvedValue('order-1')
})

test('담고 제출하면 placeOrder 를 부르고 장바구니를 비운다', async () => {
  renderWithQuery(<OrderPage />)
  await userEvent.click(await screen.findByRole('button', { name: /아메리카노/ }))
  await userEvent.click(screen.getByRole('button', { name: '장바구니에 담기' }))
  await userEvent.click(screen.getByRole('button', { name: /주문하기/ }))

  await waitFor(() => expect(api.placeOrder).toHaveBeenCalledOnce())
  expect(vi.mocked(api.placeOrder).mock.calls[0][0]).toEqual([
    { menu_id: 'm1', menu_name: '아메리카노', option_label: 'ICE · 1잔', options: { temperature: 'ice', shot: 0, light: false, syrup: false }, quantity: 1 },
  ])
  expect(await screen.findByText('주문했어요')).toBeInTheDocument()
})

test('마감이면 주문 버튼을 막고 이유를 보여준다', async () => {
  vi.mocked(api.fetchCafeStatus).mockResolvedValue({ ...openStatus, is_open: false, closes_in_seconds: 0 })
  renderWithQuery(<OrderPage />)
  expect(await screen.findByText('오늘 주문은 마감됐어요')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /주문하기/ })).toBeDisabled()
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test src/features/cafe/OrderPage.test.tsx`
Expected: FAIL — `Failed to resolve import "./OrderPage"`

- [ ] **Step 3: 구현**

`src/features/cafe/useCafeStatus.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { fetchCafeStatus } from './api'

export function useCafeStatus() {
  return useQuery({ queryKey: ['cafe-status'], queryFn: fetchCafeStatus, refetchInterval: 60_000 })
}
```

`src/features/cafe/StatusBanner.tsx`:

```tsx
import type { CafeStatus } from './api'
import styles from './StatusBanner.module.css'

export function StatusBanner({ status }: { status?: CafeStatus }) {
  if (!status) return null
  if (status.is_closed_today) return <p className={`${styles.banner} ${styles.danger}`}>오늘은 임시 휴무예요</p>
  if (!status.is_open) return <p className={`${styles.banner} ${styles.closed}`}>오늘 주문은 마감됐어요</p>

  const minutes = Math.floor(status.closes_in_seconds / 60)
  if (minutes <= 30) return <p className={`${styles.banner} ${styles.warn}`}>마감까지 {minutes}분 남았어요</p>
  return <p className={`${styles.banner} ${styles.open}`}>지금 주문할 수 있어요 · {status.closes_at.slice(0, 5)} 마감</p>
}
```

`src/features/cafe/StatusBanner.module.css`:

```css
.banner { margin: 0; padding: var(--space-3) var(--space-4); border-radius: var(--radius-field); font-size: var(--text-caption); font-weight: 500; }
.open { background: #E4F0EA; color: #2F6349; }
.warn { background: #F7ECD9; color: #8A5A15; }
.closed { background: var(--fill); color: var(--text-muted); }
.danger { background: #F7E3E2; color: var(--danger); }
```

`src/features/cafe/OrderPage.tsx`:

```tsx
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { getGuestToken } from '../../lib/guestToken'
import { fetchMenus, placeOrder, type Menu, type MenuCategory } from './api'
import { CategoryTabs } from './CategoryTabs'
import { MenuGrid } from './MenuGrid'
import { OptionSheet } from './OptionSheet'
import { StatusBanner } from './StatusBanner'
import { useCafeStatus } from './useCafeStatus'
import { useCart } from './useCart'
import styles from './OrderPage.module.css'

export function OrderPage() {
  const [category, setCategory] = useState<MenuCategory>('coffee')
  const [picked, setPicked] = useState<Menu | null>(null)
  const [toast, setToast] = useState('')
  const cart = useCart()
  const status = useCafeStatus()
  const queryClient = useQueryClient()
  const menus = useQuery({ queryKey: ['menus'], queryFn: fetchMenus })

  const submit = useMutation({
    mutationFn: () => placeOrder(cart.lines, getGuestToken()),
    onSuccess: () => {
      cart.clear()
      setToast('주문했어요')
      queryClient.invalidateQueries({ queryKey: ['guest-orders'] })
    },
    onError: (error: Error) => {
      setToast(error.message.includes('ORDER_WINDOW_CLOSED') ? '마감돼서 주문할 수 없어요' : '주문하지 못했어요')
      queryClient.invalidateQueries({ queryKey: ['cafe-status'] })
    },
  })

  const isOpen = status.data?.is_open ?? false
  const visible = (menus.data ?? []).filter((menu) => menu.category === category)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>청년부 카페</h1>
      </header>

      <StatusBanner status={status.data} />
      <CategoryTabs value={category} onChange={setCategory} />
      <MenuGrid menus={visible} counts={cart.counts} onPick={(menu) => isOpen && setPicked(menu)} />

      {toast && <p className={styles.toast}>{toast}</p>}

      <footer className={styles.footer}>
        <Button
          size="lg"
          disabled={!isOpen || cart.total === 0 || submit.isPending}
          onClick={() => submit.mutate()}
        >
          {cart.total > 0 ? `장바구니 ${cart.total}개 · 주문하기` : '주문하기'}
        </Button>
      </footer>

      {picked && (
        <OptionSheet
          menu={picked}
          onClose={() => setPicked(null)}
          onAdd={(line) => {
            cart.add(line)
            setToast(`${line.menu_name} 담았어요`)
          }}
        />
      )}
    </div>
  )
}
```

`src/features/cafe/OrderPage.module.css`:

```css
.page { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-4) var(--space-5) 96px; max-width: 1280px; margin: 0 auto; }
.header { display: flex; align-items: center; justify-content: space-between; }
.title { font-size: var(--text-screen); font-weight: 600; letter-spacing: -0.02em; margin: 0; }
@media (min-width: 1024px) { .title { font-size: var(--text-title-lg); } }
.toast { margin: 0; padding: var(--space-3) var(--space-4); border-radius: var(--radius-field); background: var(--text); color: var(--surface); font-size: var(--text-caption); }
.footer { position: fixed; left: 0; right: 0; bottom: 0; padding: var(--space-3) var(--space-5) var(--space-4); background: var(--bg); display: flex; }
.footer > * { flex: 1; }
```

`src/App.tsx`를 `OrderPage`를 그리도록 바꾸고, Task 1의 테스트가 계속 통과하는지 확인한다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS 전부

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: 주문 화면 조립과 제출"
```

---

### Task 13: 내 주문과 취소

**Files:**
- Create: `src/features/cafe/MyOrdersPage.tsx`, `src/features/cafe/MyOrdersPage.module.css`
- Modify: `src/App.tsx`(라우터 도입), `src/main.tsx`
- Test: `src/features/cafe/MyOrdersPage.test.tsx`

**Interfaces:**
- Consumes: `fetchGuestOrders`, `cancelOrderItem`, `useCafeStatus`, `StatusBanner`
- Produces: `MyOrdersPage()`, 라우트 `/`(주문)과 `/orders`(내 주문)

- [ ] **Step 1: 실패하는 테스트 작성**

`src/features/cafe/MyOrdersPage.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithQuery } from '../../test/renderWithQuery'
import { MyOrdersPage } from './MyOrdersPage'
import * as api from './api'

vi.mock('./api')

const item: api.GuestOrderItem = {
  item_id: 'i1', menu_name: '아메리카노', option_label: 'ICE · 샷 1', quantity: 2,
  status: 'ordered', ordered_at: '2026-08-31T11:24:00',
}

const openStatus: api.CafeStatus = {
  is_open: true, opens_at: '10:00:00', closes_at: '14:30:00',
  closes_in_seconds: 720, is_closed_today: false, today_isodow: 7, server_time: '2026-08-31T14:18:00',
}

beforeEach(() => {
  vi.mocked(api.fetchGuestOrders).mockResolvedValue([item])
  vi.mocked(api.fetchCafeStatus).mockResolvedValue(openStatus)
  vi.mocked(api.cancelOrderItem).mockResolvedValue()
})

test('오늘 주문과 옵션, 수량을 보여준다', async () => {
  renderWithQuery(<MyOrdersPage />)
  expect(await screen.findByText('아메리카노')).toBeInTheDocument()
  expect(screen.getByText('ICE · 샷 1')).toBeInTheDocument()
  expect(screen.getByText('2잔')).toBeInTheDocument()
})

test('취소를 누르면 cancelOrderItem 을 부른다', async () => {
  renderWithQuery(<MyOrdersPage />)
  await userEvent.click(await screen.findByRole('button', { name: '아메리카노 주문 취소' }))
  await waitFor(() => expect(api.cancelOrderItem).toHaveBeenCalledWith('i1', expect.any(String)))
})

test('마감이면 취소 버튼을 막는다', async () => {
  vi.mocked(api.fetchCafeStatus).mockResolvedValue({ ...openStatus, is_open: false, closes_in_seconds: 0 })
  renderWithQuery(<MyOrdersPage />)
  expect(await screen.findByRole('button', { name: '아메리카노 주문 취소' })).toBeDisabled()
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test src/features/cafe/MyOrdersPage.test.tsx`
Expected: FAIL — `Failed to resolve import "./MyOrdersPage"`

- [ ] **Step 3: 구현**

`src/features/cafe/MyOrdersPage.tsx`:

```tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { getGuestToken } from '../../lib/guestToken'
import { cancelOrderItem, fetchGuestOrders } from './api'
import { StatusBanner } from './StatusBanner'
import { useCafeStatus } from './useCafeStatus'
import styles from './MyOrdersPage.module.css'

export function MyOrdersPage() {
  const token = getGuestToken()
  const status = useCafeStatus()
  const queryClient = useQueryClient()
  const orders = useQuery({ queryKey: ['guest-orders', token], queryFn: () => fetchGuestOrders(token) })

  const cancel = useMutation({
    mutationFn: (itemId: string) => cancelOrderItem(itemId, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['guest-orders'] }),
    onError: () => queryClient.invalidateQueries({ queryKey: ['cafe-status'] }),
  })

  const isOpen = status.data?.is_open ?? false
  const items = orders.data ?? []

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>내 주문</h1>
      <StatusBanner status={status.data} />

      <p className={styles.guestNote}>
        게스트로 주문했어요. 브라우저를 닫으면 이 내역을 볼 수 없어요.
      </p>

      {items.length === 0 && <p className={styles.empty}>아직 주문한 음료가 없어요</p>}

      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.item_id} className={item.status === 'cancelled' ? styles.cancelled : styles.item}>
            <span className={styles.name}>{item.menu_name}</span>
            <span className={styles.option}>{item.option_label}</span>
            <span className={styles.qty}>{item.quantity}잔</span>
            {item.status === 'ordered' ? (
              <Button
                variant="secondary"
                ariaLabel={`${item.menu_name} 주문 취소`}
                disabled={!isOpen || cancel.isPending}
                onClick={() => cancel.mutate(item.item_id)}
              >
                주문 취소
              </Button>
            ) : (
              <span className={styles.badge}>취소됨</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

`src/features/cafe/MyOrdersPage.module.css`:

```css
.page { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-4) var(--space-5) var(--space-8); max-width: 720px; margin: 0 auto; }
.title { font-size: var(--text-screen); font-weight: 600; letter-spacing: -0.02em; margin: 0; }
.guestNote { margin: 0; padding: var(--space-3) var(--space-4); border-radius: var(--radius-field); background: var(--fill); font-size: var(--text-caption); color: var(--text-2); }
.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-2); }
.item, .cancelled { display: grid; grid-template-columns: 1fr auto; gap: var(--space-1) var(--space-3); align-items: center; padding: var(--space-4); border-radius: var(--radius-card); background: var(--surface); }
.cancelled { background: var(--fill); color: var(--text-muted); }
.name { font-size: var(--text-subtitle); font-weight: 600; }
.option { grid-column: 1; font-size: var(--text-caption); color: var(--text-muted); }
.qty { grid-row: 1; grid-column: 2; font-family: var(--font-mono); font-size: var(--text-caption); }
.badge { font-size: var(--text-micro); color: var(--text-muted); }
.empty { padding: var(--space-8); text-align: center; color: var(--text-muted); font-size: var(--text-caption); }
```

라우터는 `src/App.tsx`에서 `createBrowserRouter`로 `/`(OrderPage)와 `/orders`(MyOrdersPage)를 연결하고, 하단 탭으로 오간다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS 전부

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: 내 주문 조회와 취소"
```

---

### Task 14: 주문 변경 즉시 반영

**Files:**
- Create: `src/features/cafe/useOrderRealtime.ts`
- Modify: `src/features/cafe/MyOrdersPage.tsx`, `supabase/migrations/0006_realtime.sql`
- Test: `src/features/cafe/useOrderRealtime.test.ts`

**Interfaces:**
- Consumes: `supabase`
- Produces: `useOrderRealtime(onChange: () => void): void`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/features/cafe/useOrderRealtime.test.ts`:

```ts
import { renderHook } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { supabase } from '../../lib/supabase'
import { useOrderRealtime } from './useOrderRealtime'

test('order_items 변경을 구독하고 언마운트에서 해제한다', () => {
  const on = vi.fn().mockReturnThis()
  const subscribe = vi.fn().mockReturnThis()
  const channel = { on, subscribe } as never
  vi.spyOn(supabase, 'channel').mockReturnValue(channel)
  const removeChannel = vi.spyOn(supabase, 'removeChannel').mockResolvedValue('ok' as never)

  const onChange = vi.fn()
  const { unmount } = renderHook(() => useOrderRealtime(onChange))

  expect(on).toHaveBeenCalledWith(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'order_items_v2' },
    expect.any(Function),
  )
  unmount()
  expect(removeChannel).toHaveBeenCalledWith(channel)
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test src/features/cafe/useOrderRealtime.test.ts`
Expected: FAIL — `Failed to resolve import "./useOrderRealtime"`

- [ ] **Step 3: 구현**

`supabase/migrations/0006_realtime.sql`:

```sql
alter publication supabase_realtime add table public.order_items_v2;
```

`src/features/cafe/useOrderRealtime.ts`:

```ts
import { useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function useOrderRealtime(onChange: () => void): void {
  useEffect(() => {
    const channel = supabase
      .channel('order-items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items_v2' }, () => onChange())
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [onChange])
}
```

`MyOrdersPage`에서 사용:

```tsx
const invalidate = useCallback(
  () => queryClient.invalidateQueries({ queryKey: ['guest-orders'] }),
  [queryClient],
)
useOrderRealtime(invalidate)
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test src/features/cafe/useOrderRealtime.test.ts`
Expected: PASS 1개

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: 주문 변경 실시간 반영"
```

---

### Task 15: E2E와 배포

**Files:**
- Create: `playwright.config.ts`, `e2e/guest-order.spec.ts`, `vercel.json`, `README.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: 앞의 모든 태스크
- Produces: `npm run e2e`, Vercel 배포 설정

- [ ] **Step 1: Playwright 설치와 설정**

```bash
npm i -D @playwright/test
npx playwright install chromium
```

`playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://127.0.0.1:5173' },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:5173', reuseExistingServer: true },
})
```

`package.json`의 `scripts`에 `"e2e": "playwright test"`를 더한다.

- [ ] **Step 2: 실패하는 E2E 작성**

`e2e/guest-order.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('게스트가 주문하고 취소한다', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /아메리카노/ }).click()
  await page.getByRole('button', { name: '장바구니에 담기' }).click()
  await page.getByRole('button', { name: /주문하기/ }).click()
  await expect(page.getByText('주문했어요')).toBeVisible()

  await page.goto('/orders')
  await expect(page.getByText('아메리카노')).toBeVisible()
  await page.getByRole('button', { name: '아메리카노 주문 취소' }).click()
  await expect(page.getByText('취소됨')).toBeVisible()
})
```

- [ ] **Step 3: 실행해서 실패 지점 확인**

Run: `supabase start && npm run e2e`
Expected: 주문 시간대 밖이면 마감 배너에서 실패한다. 로컬 확인용으로 `cafe_settings`를 오늘 요일·`00:00~23:59`로 바꾼 뒤 다시 실행한다.

- [ ] **Step 4: 통과 확인**

Run: `npm run e2e`
Expected: PASS 1개

- [ ] **Step 5: 배포 설정**

`vercel.json`:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Vercel 프로젝트에 환경변수 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 넣는다.

> **운영 DB 반영은 여기서 멈춘다.** 마이그레이션 대상인 `youth-hanshin` 프로젝트는 v1 이 지금 쓰고 있는 운영 데이터베이스다. `supabase link` 와 `supabase db push` 는 개발자의 명시적 승인을 받은 뒤에만 실행한다. 구현자는 여기까지 준비만 하고 승인을 요청한다. 승인 후 절차: `supabase link --project-ref <youth-hanshin ref>` → **`db push` 전에 v1 객체와 이름이 겹치는지 확인한다** (`select typname from pg_type where typname in ('menu_category','order_item_status','app_role')` 와 `select proname from pg_proc where proname = 'active_cohort_id'`; 결과가 있으면 그 객체에도 `_v2` 를 붙이고 마이그레이션을 고친 뒤 다시 시도한다) → `supabase db push` → `cohorts_v2`·`cafe_settings_v2`·`menus_v2` 초기 데이터 1회 입력. 모든 마이그레이션은 새 `_v2` 객체만 만들고 v1 객체는 건드리지 않는다.

`README.md`에 로컬 실행 순서(`supabase start` → `.env.local` 작성 → `npm run dev`)와 테스트 명령 세 가지(`npm test`, `npm run test:db`, `npm run e2e`)를 적는다.

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "chore: E2E 테스트와 Vercel 배포 설정"
```

---

## 1단계 완료 조건

- 로그인 없이 메뉴를 골라 옵션을 정하고 한 번에 주문한다.
- 마감 전까지 본인 주문 항목을 취소한다. 남의 항목은 취소하지 못한다.
- 마감 시각이 지나면 주문과 취소가 DB에서 막힌다. 화면은 이유를 문구로 보여준다.
- 청년·게스트 화면 어디에도 가격이 나오지 않는다.
- 라이트·다크 테마가 저장되고 재방문 때 복원된다.
- 모바일과 데스크톱 폭에서 모두 쓸 수 있다.

## 2단계로 넘기는 것

- 카카오 로그인과 `profiles` 생성, `last_seen_at` 기록
- 로그인 사용자의 주문 내역(기수별 보관)과 게스트 주문 이어받기
- 내 정보와 항목별 공개 설정
