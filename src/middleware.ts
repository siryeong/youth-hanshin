import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/api/admin/create') {
    return NextResponse.next();
  }

  // 관리자 페이지 접근 제한 (/admin/*)
  if (pathname.startsWith('/admin') || pathname.startsWith('/event-gift-exchange/admin')) {
    // 관리자 권한 확인
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const isAdmin = !!token?.isAdmin;

    // 관리자가 아닌 경우 홈페이지로 리다이렉트
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 관리자 전용 API 접근 제한 (/api/admin/*)
  if (
    pathname.startsWith('/api/admin/') ||
    pathname.startsWith('/api/event/gift-exchange/matches')
  ) {
    // 관리자 권한 확인
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const isAdmin = !!token?.isAdmin;

    // 관리자가 아닌 경우 접근 거부
    if (!isAdmin) {
      return new NextResponse(JSON.stringify({ error: '관리자 권한이 필요합니다.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return NextResponse.next();
}

// 미들웨어가 실행될 경로 설정
export const config = {
  matcher: ['/api/:path*'],
};
