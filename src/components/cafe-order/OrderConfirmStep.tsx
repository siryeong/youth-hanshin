import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CafeMenuItem, Village, Member } from '@/model/model';

interface OrderConfirmStepProps {
  orderInfo: {
    village: Village | null;
    member: Member | null;
    customName: string | null;
    cafeMenuItem: CafeMenuItem | null;
    options: {
      temperature: 'hot' | 'ice' | null;
      strength: 'default' | 'mild' | null;
    };
  };
  isCustomName: boolean;
}

export function OrderConfirmStep({ orderInfo, isCustomName }: OrderConfirmStepProps) {
  return (
    <Card>
      <CardHeader className='p-4 sm:p-6 pb-2 sm:pb-3'>
        <CardTitle>주문 확인</CardTitle>
        <CardDescription>주문 내용을 확인해주세요</CardDescription>
      </CardHeader>
      <CardContent className='p-4 sm:p-6 pt-2 sm:pt-3 space-y-4'>
        <div className='space-y-3 p-3 sm:p-4 bg-muted/30 rounded-lg'>
          <div className='flex flex-col gap-1'>
            <span className='text-xs sm:text-sm text-muted-foreground'>마을</span>
            <span className='text-sm sm:text-base font-medium'>{orderInfo.village?.name}마을</span>
          </div>

          <div className='flex flex-col gap-1'>
            <span className='text-xs sm:text-sm text-muted-foreground'>이름</span>
            <div className='flex items-center gap-2'>
              <span className='text-sm sm:text-base font-medium'>
                {orderInfo.member?.name || orderInfo.customName}
              </span>
              {isCustomName && (
                <span className='text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded'>
                  직접 입력
                </span>
              )}
            </div>
          </div>

          {orderInfo.cafeMenuItem && (
            <div className='flex flex-col gap-1'>
              <span className='text-xs sm:text-sm text-muted-foreground'>메뉴</span>
              <span className='text-sm sm:text-base font-medium'>
                {orderInfo.options.temperature === 'hot' && '따뜻한 '}
                {orderInfo.options.temperature === 'ice' && '아이스 '}
                {orderInfo.cafeMenuItem.name}
                {orderInfo.options.strength === 'mild' && ' 연하게 '}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
