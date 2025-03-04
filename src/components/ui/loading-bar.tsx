'use client';

import { useLoading } from '@/contexts/LoadingContext';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

export function LoadingBar() {
  const { isLoading, loadingMessage } = useLoading();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;

    if (isLoading) {
      setVisible(true);
      setProgress(0);

      // 로딩 시작 시 프로그레스를 서서히 증가시킴 (최대 90%까지)
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 90) {
            const remaining = 90 - prev;
            const increment = Math.max(0.5, remaining / 20);
            return prev + increment;
          }
          return prev;
        });
      }, 200);
    } else {
      // 로딩 완료 시 100%로 설정 후 숨김
      setProgress(100);

      timeout = setTimeout(() => {
        setVisible(false);
      }, 500);
    }

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isLoading]);

  // 이벤트 핸들러 - 모든 이벤트를 중지
  const preventAllEvents = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  if (!visible && !isLoading) return null;

  return (
    <>
      <div className='fixed top-0 left-0 right-0 z-50'>
        <Progress
          value={progress}
          className={cn(
            'h-1 rounded-none transition-opacity duration-300',
            isLoading ? 'opacity-100' : 'opacity-0',
          )}
          indicatorClassName='bg-primary transition-all duration-300 ease-out'
        />
      </div>

      {isLoading && (
        <div
          className='fixed inset-0 z-40 bg-background/70 backdrop-blur-[2px] cursor-wait flex flex-col items-center justify-center'
          onClick={preventAllEvents}
          onMouseDown={preventAllEvents}
          onMouseUp={preventAllEvents}
          onTouchStart={preventAllEvents}
          onTouchMove={preventAllEvents}
          onTouchEnd={preventAllEvents}
          onKeyDown={preventAllEvents}
          tabIndex={0}
          aria-hidden='true'
        >
          <Card className='shadow-lg border-none bg-background/95 max-w-[90%] w-auto'>
            <CardContent className='flex flex-col items-center justify-center p-6 space-y-4'>
              <div className='relative'>
                <div className='absolute inset-0 flex items-center justify-center'>
                  <div className='h-8 w-8 rounded-full border-2 border-primary opacity-20 animate-ping' />
                </div>
                <Loader2 className='h-10 w-10 animate-spin text-primary relative z-10' />
              </div>

              {loadingMessage && (
                <p className='text-center text-sm font-medium text-muted-foreground'>
                  {loadingMessage}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
