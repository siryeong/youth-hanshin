import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coffee } from 'lucide-react';

export default function Home() {
  return (
    <div className='min-h-screen bg-background'>
      <div className='container mx-auto px-4 py-8 pb-24'>
        <h1 className='text-3xl font-bold mb-8 text-center'>분당 한신교회 청년부</h1>

        <Card className='mx-auto max-w-3xl mb-8'>
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
              분당 한신교회 청년부에 오신 것을 환영합니다. 우리는 함께 믿음 안에서 성장하고, 서로를
              격려하며, 하나님의 사랑을 나누는 공동체입니다.
            </p>
          </CardContent>
        </Card>

        <div className='w-full max-w-md mx-auto'>
          <Card className='hover:shadow-md transition-all'>
            <CardHeader>
              <CardTitle className='text-xl flex items-center justify-center gap-2'>
                <Coffee className='h-5 w-5' />
                마을모임 음료 주문
              </CardTitle>
            </CardHeader>
            <CardContent className='text-center pb-6'>
              <p className='text-muted-foreground mb-6'>
                청년부 카페에서 다양한 음료를 주문하고 함께 교제하세요.
              </p>
              <Link href='/cafe-order'>
                <Button size='lg' className='w-full'>
                  음료 주문하기
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
