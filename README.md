# Youth Hanshin 프로젝트

한신 마을 주민들을 위한 주문 관리 시스템입니다.

## 개발 환경 설정

### 필수 요구사항

- Node.js 18 이상
- Postgres

### 환경 변수 설정

1. 로컬 개발 환경을 위한 `.env` 파일 생성:

```bash
# postgres
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"

# 환경 설정
NODE_ENV=development

# NextAuth 설정
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=next_auth_secret

# 관리자 설정
ADMIN_SECRET_KEY=admin_secret_key
```

### 로컬 개발 환경 실행

0. postgres 도커 실행:

```bash
npm run db:up
```

1. 개발 서버 실행:

```bash
npm run dev
```

2. 브라우저에서 http://localhost:3000 접속

### 배포 환경 실행

1. 애플리케이션 빌드:

```bash
npm run build
```

2. 애플리케이션 실행:

```bash
npm run start
```

## 개발/배포 환경

이 프로젝트는 Postgres를 데이터베이스로 사용합니다. 모든 API 엔드포인트는 Postgres 클라이언트를 통해 데이터에 접근합니다.

## 기술 스택

- Next.js 15
- React 19
- TypeScript
- Postgres
- Tailwind CSS
- Drizzle ORM

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

## Vercel에 배포하기

Next.js 앱을 배포하는 가장 쉬운 방법은 Next.js 제작자가 만든 [Vercel 플랫폼](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)을 사용하는 것입니다.

자세한 내용은 [Next.js 배포 문서](https://nextjs.org/docs/app/building-your-application/deploying)를 확인하세요.

### Vercel에 배포하기

Vercel에 애플리케이션을 배포할 때 다음 설정이 필요합니다:

1. **환경 변수 설정**:
   Vercel 프로젝트 설정에서 다음 환경 변수를 추가하세요:

   - `DATABASE_URL`: Postgres URL

2. **배포 후 확인**:
   배포 후 Vercel 로그를 확인하여 애플리케이션이 올바르게 실행되는지 확인하세요.
   문제가 발생하면 다음을 시도해 보세요:
   - Vercel 대시보드에서 프로젝트를 선택하고 "Redeploy" 버튼을 클릭하세요.
   - "Clear Cache and Redeploy" 옵션을 사용하여 캐시를 지우고 다시 배포하세요.
