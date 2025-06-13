'use client';

import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import Link from 'next/link';
import { Toaster } from '@/components/ui/sonner';
import { useCafeOrder } from '@/components/cafe-order/useCafeOrder';
import { CafeStatusBar } from '@/components/cafe-order/CafeStatusBar';
import { OrderStepIndicator } from '@/components/cafe-order/OrderStepIndicator';
import { OrderInfoStep } from '@/components/cafe-order/OrderInfoStep';
import { MenuSelectionStep } from '@/components/cafe-order/MenuSelectionStep';
import { OrderConfirmStep } from '@/components/cafe-order/OrderConfirmStep';
import { OrderBottomBar } from '@/components/cafe-order/OrderBottomBar';
import { DuplicateOrderModal } from '@/components/cafe-order/DuplicateOrderModal';
import { OrderCompleteModal } from '@/components/cafe-order/OrderCompleteModal';

export default function CafeOrderPage() {
  const {
    // 상태
    orderInfo,
    isCustomName,
    orderStep,
    isCafeOpen,
    currentTime,
    cafeSetting,
    showOrderComplete,
    showDuplicateWarning,
    duplicateOrderInfo,
    completedOrderInfo,
    isProcessingOrder,
    villages,
    menuItems,
    error,
    spacerHeight,

    // 액션
    selectMenuItem,
    selectTemperature,
    clearCart,
    selectVillage,
    selectMember,
    handleCustomNameChange,
    applyCustomName,
    isOrderInfoValid,
    closeDuplicateWarning,
    createNewOrderAnyway,
    updateExistingOrder,
    handleOrder,
    startNewOrder,
    goHome,
    goToNextStep,
    goToPrevStep,
    setOrderInfo,
  } = useCafeOrder();

  // 오류 표시
  if (error) {
    return (
      <div className='container mx-auto py-8 flex items-center justify-center min-h-[60vh]'>
        <div className='text-center'>
          <p className='text-lg text-red-500'>{error}</p>
          <Button onClick={() => window.location.reload()} className='mt-4'>
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-4 sm:py-8 pb-24'>
      <div className='flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-2'>
        <Link href='/'>
          <Button variant='outline' size='sm' className='flex items-center gap-2'>
            <Home className='h-4 w-4' />
            홈으로
          </Button>
        </Link>
        <h1 className='text-2xl sm:text-3xl font-bold text-center'>카페 음료 주문</h1>
        <div className='hidden sm:block w-[85px]'></div>
      </div>

      {/* 카페 영업 시간 정보 표시 */}
      <CafeStatusBar isCafeOpen={isCafeOpen} currentTime={currentTime} cafeSetting={cafeSetting} />

      <div className='flex flex-col gap-6 sm:gap-8'>
        {/* 주문 단계 표시 */}
        <OrderStepIndicator currentStep={orderStep} />

        {/* 주문 정보 입력 */}
        {orderStep === 'info' && (
          <OrderInfoStep
            villages={villages}
            orderInfo={orderInfo}
            isCustomName={isCustomName}
            selectVillage={selectVillage}
            selectMember={selectMember}
            handleCustomNameChange={handleCustomNameChange}
            applyCustomName={applyCustomName}
          />
        )}

        {/* 메뉴 선택 */}
        {orderStep === 'menu' && (
          <MenuSelectionStep
            menuItems={menuItems}
            orderInfo={orderInfo}
            selectMenuItem={selectMenuItem}
          />
        )}

        {/* 주문 확인 */}
        {orderStep === 'cart' && (
          <OrderConfirmStep orderInfo={orderInfo} isCustomName={isCustomName} />
        )}
      </div>

      {/* 하단 고정 네비게이션 */}
      <OrderBottomBar
        orderStep={orderStep}
        orderInfo={orderInfo}
        isCafeOpen={isCafeOpen}
        isProcessingOrder={isProcessingOrder}
        isOrderInfoValid={isOrderInfoValid}
        goToPrevStep={goToPrevStep}
        goToNextStep={goToNextStep}
        handleOrder={handleOrder}
        clearCart={clearCart}
        selectTemperature={selectTemperature}
        setOrderInfo={setOrderInfo}
        spacerHeight={spacerHeight}
      />

      {/* 중복 주문 경고 모달 */}
      <DuplicateOrderModal
        isOpen={showDuplicateWarning}
        duplicateOrderInfo={duplicateOrderInfo}
        onUpdateExisting={updateExistingOrder}
        onCreateNew={createNewOrderAnyway}
        onClose={closeDuplicateWarning}
      />

      {/* 주문 완료 모달 */}
      <OrderCompleteModal
        isOpen={showOrderComplete}
        completedOrderInfo={completedOrderInfo}
        onStartNewOrder={startNewOrder}
        onGoHome={goHome}
      />

      <Toaster position='top-center' />
    </div>
  );
}
