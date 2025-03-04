'use client';

import Link from 'next/link';
import UserMenu from '@/components/auth/UserMenu';

export default function Header() {
  return (
    <header className='border-b bg-background'>
      <div className='container mx-auto flex h-16 items-center justify-between px-4'>
        <div className='flex items-center gap-6'>
          <Link href='/' className='flex items-center gap-2'>
            <span className='text-xl font-bold'>청년 한신</span>
          </Link>
          <nav className='hidden md:flex items-center gap-6'>
            <Link href='/' className='text-sm font-medium transition-colors hover:text-primary'>
              홈
            </Link>
            <Link
              href='/cafe-order'
              className='text-sm font-medium transition-colors hover:text-primary'
            >
              카페 주문
            </Link>
          </nav>
        </div>
        <UserMenu />
      </div>
    </header>
  );
}
