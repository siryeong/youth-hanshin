# Youth Hanshin 프로젝트

한신 마을 주민들을 위한 주문 관리 시스템입니다.

## 개발 환경 설정

### 필수 요구사항

- Node.js 18 이상
- Docker 및 Docker Compose
- PostgreSQL (로컬 개발용)

### 환경 변수 설정

1. 로컬 개발 환경을 위한 `.env.local` 파일 생성:

```bash
# 환경 설정
NODE_ENV=development
USE_SUPABASE=false

# Supabase 연결 정보 (배포 환경에서 사용)
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# 로컬 PostgreSQL 연결 정보
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=youth_hanshin
```

2. 배포 환경을 위한 `.env.production` 파일 생성:

```bash
# 환경 설정
NODE_ENV=production
USE_SUPABASE=true

# Supabase 연결 정보
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### 로컬 개발 환경 실행

1. 로컬 PostgreSQL 데이터베이스 실행:

```bash
npm run db:up
```

2. 개발 서버 실행:

```bash
npm run dev
```

3. 브라우저에서 http://localhost:3000 접속

### 배포 환경 실행

1. 애플리케이션 빌드:

```bash
npm run build
```

2. 애플리케이션 실행:

```bash
npm run start
```

## 데이터베이스 구조

프로젝트는 다음과 같은 테이블 구조를 가지고 있습니다:

- `villages`: 마을 정보
- `village_members`: 마을 주민 정보
- `menu_categories`: 메뉴 카테고리
- `menu_items`: 메뉴 아이템
- `orders`: 주문 정보

## 개발/배포 환경 전환

- 로컬 개발 환경에서는 로컬 PostgreSQL을 사용합니다.
- 배포 환경에서는 Supabase를 사용합니다.

환경 전환은 `USE_SUPABASE` 환경 변수를 통해 제어됩니다:

- `USE_SUPABASE=false`: 로컬 PostgreSQL 사용
- `USE_SUPABASE=true`: Supabase 사용

## 기술 스택

- Next.js 15
- React 19
- TypeScript
- PostgreSQL
- Supabase
- Docker
- Tailwind CSS

## 시작하기

먼저, 개발 서버를 실행하세요:

```bash
npm run dev
# 또는
yarn dev
# 또는
pnpm dev
# 또는
bun dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하여 결과를 확인하세요.

`app/page.tsx` 파일을 수정하여 페이지 편집을 시작할 수 있습니다. 파일을 수정하면 페이지가 자동으로 업데이트됩니다.

이 프로젝트는 [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)를 사용하여 Vercel의 새로운 폰트 패밀리인 [Geist](https://vercel.com/font)를 자동으로 최적화하고 로드합니다.

## 데이터베이스 설정

이 프로젝트는 PostgreSQL을 데이터베이스로 사용합니다. 개발 환경에서는 Docker를 사용하여 PostgreSQL을 실행합니다.

### 사전 요구사항

- [Docker](https://www.docker.com/products/docker-desktop)
- [Docker Compose](https://docs.docker.com/compose/install/)

### 데이터베이스 시작하기

PostgreSQL 데이터베이스를 시작하려면:

```bash
npm run db:up
```

이 명령어는 5432 포트에서 PostgreSQL 서버를, 5050 포트에서 pgAdmin을 실행합니다.

### 데이터베이스 중지하기

PostgreSQL 데이터베이스를 중지하려면:

```bash
npm run db:down
```

### 데이터베이스 연결 정보

- **PostgreSQL**:

  - 호스트: localhost
  - 포트: 5432
  - 사용자명: postgres
  - 비밀번호: postgres
  - 데이터베이스: youth_hanshin

- **pgAdmin**:
  - URL: http://localhost:5050
  - 이메일: admin@admin.com
  - 비밀번호: admin

## Vercel에 배포하기

Next.js 앱을 배포하는 가장 쉬운 방법은 Next.js 제작자가 만든 [Vercel 플랫폼](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)을 사용하는 것입니다.

자세한 내용은 [Next.js 배포 문서](https://nextjs.org/docs/app/building-your-application/deploying)를 확인하세요.

### Vercel에 Prisma 배포하기

Vercel에 Prisma를 사용하는 애플리케이션을 배포할 때 다음 설정이 필요합니다:

1. **환경 변수 설정**:
   Vercel 프로젝트 설정에서 다음 환경 변수를 추가하세요:

   - `DATABASE_URL`: PostgreSQL 또는 Supabase 데이터베이스 연결 문자열
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase URL (Supabase 사용 시)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Key (Supabase 사용 시)
   - `USE_SUPABASE`: Supabase 사용 여부 (`true` 또는 `false`)

2. **빌드 설정**:
   이 프로젝트는 이미 Vercel 배포를 위한 빌드 설정이 포함되어 있습니다:

   - `package.json`의 `build` 스크립트에 `prisma generate` 명령이 포함되어 있습니다.
   - `postinstall` 스크립트에도 `prisma generate` 명령이 포함되어 있습니다.
   - `prisma/schema.prisma` 파일에 Vercel 환경을 위한 `binaryTargets` 설정이 포함되어 있습니다.

3. **데이터베이스 연결 문자열**:
   Supabase를 사용하는 경우, Supabase 대시보드에서 연결 문자열을 찾을 수 있습니다:

   - Supabase 프로젝트 > 설정 > 데이터베이스 > 연결 문자열 > URI

4. **배포 후 확인**:
   배포 후 Vercel 로그를 확인하여 Prisma 클라이언트가 올바르게 생성되었는지 확인하세요.
   문제가 발생하면 다음을 시도해 보세요:
   - Vercel 대시보드에서 프로젝트를 선택하고 "Redeploy" 버튼을 클릭하세요.
   - "Clear Cache and Redeploy" 옵션을 사용하여 캐시를 지우고 다시 배포하세요.
