import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { CafeOrder } from '@/model/model';

interface DuplicateOrderModalProps {
  isOpen: boolean;
  duplicateOrderInfo: CafeOrder | null;
  onUpdateExisting: () => Promise<void>;
  onCreateNew: () => Promise<void>;
  onClose: () => void;
}

export function DuplicateOrderModal({
  isOpen,
  duplicateOrderInfo,
  onUpdateExisting,
  onCreateNew,
  onClose,
}: DuplicateOrderModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'update' | 'create' | null>(null);

  if (!isOpen || !duplicateOrderInfo) return null;

  const handleUpdateExisting = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setLoadingAction('update');

    try {
      await onUpdateExisting();
      onClose(); // 작업 완료 후 모달 닫기
    } catch (error) {
      console.error('주문 업데이트 중 오류:', error);
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleCreateNew = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setLoadingAction('create');

    try {
      await onCreateNew();
      onClose(); // 작업 완료 후 모달 닫기
    } catch (error) {
      console.error('새 주문 생성 중 오류:', error);
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4 text-center'>
        <div className='flex justify-center mb-4'>
          <AlertTriangle className='h-16 w-16 text-amber-500' />
        </div>
        <h2 className='text-xl font-bold mb-2'>중복 주문 감지됨</h2>
        <p className='mb-4'>
          {duplicateOrderInfo.village.name}{' '}
          {duplicateOrderInfo.member?.name || duplicateOrderInfo.customName}님은 오늘 이미{' '}
          주문하셨습니다.
        </p>
        <div className='bg-amber-50 p-3 rounded-md mb-6'>
          <p className='font-medium'>기존 주문 내역</p>
          <p>
            {duplicateOrderInfo.options.temperature === 'ice' && '아이스 '}
            {duplicateOrderInfo.options.temperature === 'hot' && '따뜻한 '}
            {duplicateOrderInfo.cafeMenuItem.name}
            {duplicateOrderInfo.options.strength === 'mild' && ' 연하게 '}
          </p>
        </div>
        <div className='flex flex-col gap-3'>
          <Button
            onClick={handleUpdateExisting}
            className='w-full'
            variant='outline'
            disabled={isLoading}
          >
            {isLoading && loadingAction === 'update' ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                변경 처리 중...
              </>
            ) : (
              '기존 주문 변경하기'
            )}
          </Button>
          <Button onClick={handleCreateNew} className='w-full' disabled={isLoading}>
            {isLoading && loadingAction === 'create' ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                주문 추가 중...
              </>
            ) : (
              '새로운 주문으로 추가하기'
            )}
          </Button>
          <Button
            onClick={handleClose}
            className='w-full mt-2'
            variant='ghost'
            disabled={isLoading}
          >
            취소
          </Button>
        </div>
      </div>
    </div>
  );
}
