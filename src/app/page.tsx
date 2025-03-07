'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coffee, ListChecks } from 'lucide-react';

export default function Home() {
  return (
    <div className='min-h-screen bg-background'>
      <div className='container mx-auto px-4 py-8 pb-24'>
        <h1 className='text-3xl font-bold mb-8 text-center'>분당 한신교회 청년부</h1>

        <Card className='mx-auto max-w-4xl mb-8'>
          <CardHeader className='flex flex-col items-center space-y-6'>
            <div className='transform hover:scale-105 transition-transform duration-300 flex justify-center'>
              <Image
                src='/images/title-image.jpg'
                alt='청년 한신'
                width={250}
                height={250}
                priority
                className='drop-shadow-lg'
              />
            </div>
            <div className='space-y-2 text-center'>
              <p className='text-muted-foreground max-w-2xl'>함께 성장하고 나누는 청년들의 공간</p>
            </div>
          </CardHeader>
          <CardContent className='flex flex-col items-center space-y-6'>
            <p className='text-center text-muted-foreground max-w-xl'>
              분당한신교회 청년부에 오신 것을 환영합니다.
              <br />
              우리는 함께 믿음 안에서 성장하고, <br />
              서로를 격려하며, 하나님의 사랑을 나누는 공동체입니다.
            </p>
          </CardContent>
        </Card>

        <div className='max-w-4xl mx-auto'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6'>
            <Card className='hover:shadow-md transition-all h-full flex flex-col'>
              <CardHeader>
                <CardTitle className='text-xl flex items-center justify-center gap-2'>
                  <Coffee className='h-5 w-5' />
                  마을모임 음료 주문
                </CardTitle>
              </CardHeader>
              <CardContent className='text-center flex-1 flex flex-col'>
                <p className='text-muted-foreground mb-auto'>
                  청년부 카페에서 다양한 음료를 주문하고 함께 교제하세요.
                </p>
                <div className='mt-6'>
                  <Link href='/cafe-order' className='w-full block'>
                    <Button size='lg' className='w-full'>
                      음료 주문하기
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className='hover:shadow-md transition-all h-full flex flex-col'>
              <CardHeader>
                <CardTitle className='text-xl flex items-center justify-center gap-2'>
                  <ListChecks className='h-5 w-5' />
                  주문 현황
                </CardTitle>
              </CardHeader>
              <CardContent className='text-center flex-1 flex flex-col'>
                <p className='text-muted-foreground mb-auto'>
                  오늘의 마을별 주문 현황을 확인할 수 있습니다. 실시간으로 업데이트되는 주문 상태를
                  확인하세요.
                </p>
                <div className='mt-6'>
                  <Link href='/order-status' className='w-full block'>
                    <Button size='lg' className='w-full'>
                      주문 현황 보기
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
