'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // 로딩 중이면 아무것도 하지 않음
    if (status === 'loading') return;

    // 인증되지 않은 경우 로그인 페이지로 리디렉션
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // 관리자 권한이 필요한데 관리자가 아닌 경우
    if (requireAdmin && !session?.user?.isAdmin) {
      router.push('/');
    }
  }, [status, session, router, requireAdmin]);

  // 로딩 중이거나 인증되지 않은 경우 로딩 표시
  if (status === 'loading') {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto'></div>
          <p className='mt-4 text-lg'>로딩 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우 아무것도 표시하지 않음 (리디렉션 처리 중)
  if (status === 'unauthenticated') {
    return null;
  }

  // 관리자 권한이 필요한데 관리자가 아닌 경우
  if (requireAdmin && !session?.user?.isAdmin) {
    return null;
  }

  // 인증된 경우 자식 컴포넌트 표시
  return <>{children}</>;
}
