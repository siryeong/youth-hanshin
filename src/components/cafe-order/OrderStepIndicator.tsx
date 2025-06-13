interface OrderStepIndicatorProps {
  currentStep: 'info' | 'menu' | 'cart';
}

export function OrderStepIndicator({ currentStep }: OrderStepIndicatorProps) {
  return (
    <div className='flex justify-center mb-2 sm:mb-4'>
      <div className='flex items-center'>
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${currentStep === 'info' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
        >
          1
        </div>
        <div className='w-10 sm:w-16 h-1 bg-muted'></div>
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${currentStep === 'menu' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
        >
          2
        </div>
        <div className='w-10 sm:w-16 h-1 bg-muted'></div>
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${currentStep === 'cart' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
        >
          3
        </div>
      </div>
    </div>
  );
}
