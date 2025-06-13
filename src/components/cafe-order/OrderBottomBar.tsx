import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CafeMenuItem, TemperatureType, StrengthType, Village, Member } from '@/model/model';

interface OrderInfo {
  village: Village;
  member: Member;
  customName: string | null;
  cafeMenuItem: CafeMenuItem | null;
  options: {
    temperature: TemperatureType;
    strength: StrengthType;
  };
}

interface OrderBottomBarProps {
  orderStep: 'info' | 'menu' | 'cart';
  orderInfo: {
    village: Village;
    member: Member;
    customName: string | null;
    cafeMenuItem: CafeMenuItem | null;
    options: {
      temperature: TemperatureType;
      strength: StrengthType;
    };
  };
  isCafeOpen: boolean;
  isProcessingOrder: boolean;
  isOrderInfoValid: () => boolean;
  goToPrevStep: () => void;
  goToNextStep: () => void;
  handleOrder: () => void;
  clearCart: () => void;
  selectTemperature: (temp: TemperatureType) => void;
  setOrderInfo: (orderInfo: OrderInfo) => void;
  spacerHeight: string;
}

export function OrderBottomBar({
  orderStep,
  orderInfo,
  isCafeOpen,
  isProcessingOrder,
  isOrderInfoValid,
  goToPrevStep,
  goToNextStep,
  handleOrder,
  clearCart,
  selectTemperature,
  setOrderInfo,
  spacerHeight,
}: OrderBottomBarProps) {
  return (
    <>
      {/* 동적 스페이서 - 하단 고정 바의 높이에 맞게 조정 */}
      <div
        className='w-full'
        style={{
          height: spacerHeight,
        }}
      />

      {/* 하단 고정 네비게이션 */}
      <div className='fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg flex justify-center'>
        <div className='w-full max-w-screen-lg'>
          {/* 온도 선택 영역 (메뉴 선택 단계에서 온도 선택이 필요한 메뉴가 선택된 경우) */}
          {orderStep === 'menu' &&
            orderInfo.cafeMenuItem &&
            orderInfo.cafeMenuItem.requiredOptions.temperature && (
              <div className='px-3 sm:px-4 py-2 sm:py-3 border-b'>
                <div className='flex flex-col gap-2'>
                  <p className='text-xs sm:text-sm text-muted-foreground'>온도를 선택해주세요</p>
                  <div className='grid grid-cols-2 gap-2 sm:gap-3'>
                    <Button
                      variant={orderInfo.options.temperature === 'hot' ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => selectTemperature('hot')}
                      className='h-9 sm:h-10 text-sm sm:text-base w-full'
                    >
                      따뜻하게
                    </Button>
                    <Button
                      variant={orderInfo.options.temperature === 'ice' ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => selectTemperature('ice')}
                      className='h-9 sm:h-10 text-sm sm:text-base w-full'
                    >
                      차갑게
                    </Button>
                  </div>
                </div>
              </div>
            )}

          {/* 연하게 옵션 선택 영역 (메뉴 선택 단계에서 메뉴가 선택된 경우) */}
          {orderStep === 'menu' &&
            orderInfo.cafeMenuItem &&
            orderInfo.cafeMenuItem.requiredOptions.strength && (
              <div className='px-3 sm:px-4 py-2 sm:py-3 border-b'>
                <div className='flex flex-col gap-2'>
                  <p className='text-xs sm:text-sm text-muted-foreground'>샷 농도를 선택해주세요</p>
                  <div className='grid grid-cols-2 gap-2 sm:gap-3'>
                    <Button
                      variant={orderInfo.options.strength === 'default' ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => {
                        setOrderInfo({
                          ...orderInfo,
                          options: { ...orderInfo.options, strength: 'default' },
                        });
                      }}
                      className='h-9 sm:h-10 text-sm sm:text-base w-full'
                    >
                      기본
                    </Button>
                    <Button
                      variant={orderInfo.options.strength === 'mild' ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => {
                        setOrderInfo({
                          ...orderInfo,
                          options: { ...orderInfo.options, strength: 'mild' },
                        });
                      }}
                      className='h-9 sm:h-10 text-sm sm:text-base w-full'
                    >
                      연하게
                    </Button>
                  </div>
                </div>
              </div>
            )}

          <div className='p-3 sm:p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground text-xs sm:text-sm`}
                >
                  {orderStep === 'info' ? '1' : orderStep === 'menu' ? '2' : '3'}
                </div>

                {/* 주문 정보 단계에서 마을이 선택된 경우 마을 이름 표시 */}
                {orderStep === 'info' && orderInfo.village ? (
                  <p className='font-medium text-xs sm:text-sm'>
                    {orderInfo.village?.name}마을 - {orderInfo.member?.name || orderInfo.customName}
                  </p>
                ) : /* 메뉴 선택 단계에서 메뉴가 선택된 경우 메뉴 이름 표시 */
                orderStep === 'menu' && orderInfo.cafeMenuItem ? (
                  <p className='font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none'>
                    {orderInfo.options?.temperature === 'hot' && '따뜻한 '}
                    {orderInfo.options?.temperature === 'ice' && '아이스 '}
                    {orderInfo.cafeMenuItem.name}
                    {orderInfo.options?.strength === 'mild' && ' 연하게'}
                  </p>
                ) : (
                  /* 그 외의 경우 단계 이름 표시 */
                  <span className='font-medium text-xs sm:text-sm'>
                    {orderStep === 'info'
                      ? '주문 정보'
                      : orderStep === 'menu'
                        ? '메뉴 선택'
                        : '주문 확인'}
                  </span>
                )}
              </div>

              {/* 오른쪽: 버튼 영역 */}
              <div className='flex items-center gap-2'>
                {/* 메뉴 선택 단계에서 메뉴가 선택된 경우 취소 버튼 표시 */}
                {orderStep === 'menu' && orderInfo.cafeMenuItem && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={clearCart}
                    className='h-10 sm:h-11 px-4 sm:px-5 text-sm sm:text-base'
                  >
                    취소
                  </Button>
                )}

                {/* 이전 단계 버튼 (첫 단계가 아닐 경우) */}
                {orderStep !== 'info' && (
                  <Button
                    variant='outline'
                    size='default'
                    onClick={goToPrevStep}
                    className='h-11 sm:h-12 px-4 sm:px-5 text-sm sm:text-base'
                  >
                    <ChevronLeft className='h-4 w-4 sm:h-5 sm:w-5' />
                    <span>이전</span>
                  </Button>
                )}

                {/* 다음 단계 또는 주문 완료 버튼 */}
                {orderStep === 'cart' ? (
                  <Button
                    size='default'
                    onClick={handleOrder}
                    disabled={!isCafeOpen || isProcessingOrder}
                    className='h-11 sm:h-12 px-4 sm:px-5 text-sm sm:text-base'
                  >
                    <span>
                      {!isCafeOpen
                        ? '영업 시간이 아닙니다'
                        : isProcessingOrder
                          ? '주문 처리 중...'
                          : '주문 완료'}
                    </span>
                  </Button>
                ) : (
                  <Button
                    size='default'
                    onClick={goToNextStep}
                    disabled={
                      !isCafeOpen ||
                      (orderStep === 'info' && !isOrderInfoValid()) ||
                      (orderStep === 'menu' && !orderInfo.cafeMenuItem)
                    }
                    className='h-11 sm:h-12 px-4 sm:px-5 text-sm sm:text-base'
                  >
                    <span>{!isCafeOpen ? '영업 시간이 아닙니다' : '다음'}</span>
                    <ChevronRight className='h-4 w-4 sm:h-5 sm:w-5' />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
