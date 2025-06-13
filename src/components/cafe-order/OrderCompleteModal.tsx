import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { CafeOrder } from '@/model/model';

interface OrderCompleteModalProps {
  isOpen: boolean;
  completedOrderInfo: CafeOrder | null;
  onStartNewOrder: () => Promise<void>;
  onGoHome: () => Promise<void>;
}

export function OrderCompleteModal({
  isOpen,
  completedOrderInfo,
  onStartNewOrder,
  onGoHome,
}: OrderCompleteModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !completedOrderInfo) return null;

  const handleStartNewOrder = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      await onStartNewOrder();
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoHome = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      await onGoHome();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4 text-center'>
        <div className='flex justify-center mb-4'>
          <CheckCircle className='h-16 w-16 text-green-500' />
        </div>
        <h2 className='text-2xl font-bold mb-2'>주문 완료!</h2>
        <p className='mb-4'>
          {completedOrderInfo.village.name}마을{' '}
          {completedOrderInfo.member?.name || completedOrderInfo.customName}님의 주문이
          완료되었습니다.
        </p>
        <div className='bg-slate-50 p-3 rounded-md mb-6'>
          <p className='font-medium'>주문 내역</p>
          <p>
            {completedOrderInfo.options.temperature === 'ice' && '아이스 '}
            {completedOrderInfo.options.temperature === 'hot' && '따뜻한 '}
            {completedOrderInfo.cafeMenuItem.name}
            {completedOrderInfo.options.strength === 'mild' && ' 연하게 '}
          </p>
        </div>
        <div className='flex flex-col gap-3'>
          <Button
            onClick={handleStartNewOrder}
            className='w-full'
            variant='outline'
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                처리 중...
              </>
            ) : (
              '새로운 주문 작성하기'
            )}
          </Button>
          <Button onClick={handleGoHome} className='w-full' disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                이동 중...
              </>
            ) : (
              '홈으로 이동하기'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
