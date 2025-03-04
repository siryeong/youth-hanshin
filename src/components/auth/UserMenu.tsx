'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function UserMenu() {
  const { data: session, status } = useSession();

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  if (status === 'loading') {
    return <div className='text-sm text-muted-foreground'>로딩 중...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className='flex items-center gap-2'>
        <Link href='/login'>
          <Button variant='outline' size='sm'>
            로그인
          </Button>
        </Link>
        <Link href='/create-admin'>
          <Button variant='ghost' size='sm' className='text-xs text-muted-foreground'>
            관리자 생성
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className='flex items-center gap-4'>
      <div className='text-sm'>
        <span className='text-muted-foreground mr-1'>안녕하세요,</span>
        <span className='font-medium'>{session?.user?.name || '사용자'}</span>
        {session?.user?.isAdmin && (
          <span className='ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full'>
            관리자
          </span>
        )}
      </div>
      <Button variant='outline' size='sm' onClick={handleLogout}>
        로그아웃
      </Button>
      {session?.user?.isAdmin && (
        <Link href='/admin'>
          <Button variant='default' size='sm'>
            관리자 페이지
          </Button>
        </Link>
      )}
    </div>
  );
}
