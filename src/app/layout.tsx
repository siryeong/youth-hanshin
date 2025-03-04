import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/components/auth/SessionProvider';
import Header from '@/components/layout/Header';
import { LoadingProvider } from '@/contexts/LoadingContext';
import { LoadingBar } from '@/components/ui/loading-bar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '청년 한신 - 함께 성장하는 청년들의 공간',
  description:
    '청년 한신은 다양한 청년들이 함께 소통하고 성장하는 공간입니다. 교육, 문화, 커뮤니티 프로그램을 통해 청년들의 성장을 지원합니다.',
  icons: {
    icon: '/images/youth-hanshin-favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ko'>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider>
          <LoadingProvider>
            <LoadingBar />
            <div className='flex min-h-screen flex-col'>
              <Header />
              <main className='flex-1'>{children}</main>
            </div>
          </LoadingProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
