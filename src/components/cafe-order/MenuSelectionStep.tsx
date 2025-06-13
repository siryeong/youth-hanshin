import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Coffee, CupSoda } from 'lucide-react';
import { CafeMenuItem } from '@/model/model';

interface MenuSelectionStepProps {
  menuItems: CafeMenuItem[];
  orderInfo: {
    cafeMenuItem: CafeMenuItem | null;
    options: {
      temperature: 'hot' | 'ice' | null;
      strength: 'default' | 'mild' | null;
    };
  };
  selectMenuItem: (item: CafeMenuItem) => void;
}

export function MenuSelectionStep({
  menuItems,
  orderInfo,
  selectMenuItem,
}: MenuSelectionStepProps) {
  return (
    <Card>
      <CardHeader className='p-4 sm:p-6'>
        <CardTitle>메뉴 선택</CardTitle>
        <CardDescription>원하시는 메뉴를 선택해주세요</CardDescription>
      </CardHeader>
      <CardContent className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
        <div className='space-y-3'>
          <Label>메뉴</Label>
          <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 sm:gap-3'>
            {menuItems.map((item) => (
              <Card
                key={item.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${orderInfo.cafeMenuItem?.id === item.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => selectMenuItem(item)}
              >
                <div className='flex items-center p-1.5 sm:p-2'>
                  <div className='w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 mr-2 sm:mr-3 flex-shrink-0 flex items-center justify-center overflow-hidden'>
                    <div className='text-gray-500'>
                      {item.category === 'coffee' && <Coffee className='w-5 h-5 sm:w-6 sm:h-6' />}
                      {item.category === 'tea' && <CupSoda className='w-5 h-5 sm:w-6 sm:h-6' />}
                    </div>
                  </div>
                  <CardTitle className='text-xs sm:text-sm'>{item.name}</CardTitle>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {orderInfo.cafeMenuItem && (
          <div className='mt-3 sm:mt-4'>
            <p className='text-xs sm:text-sm text-muted-foreground'>
              선택된 메뉴:
              {orderInfo.options.temperature === 'hot' && '따뜻한 '}
              {orderInfo.options.temperature === 'ice' && '아이스 '}
              {orderInfo.cafeMenuItem.name}
              {orderInfo.options.strength === 'mild' && ' 연하게'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
