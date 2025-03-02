'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// 메뉴 아이템 타입 정의
type MenuItem = {
  id: number;
  name: string;
  description: string;
  category: 'coffee' | 'tea' | 'dessert';
  image: string;
};

// 카트 아이템 타입 정의
type CartItem = MenuItem & {
  temperature?: 'hot' | 'ice';
};

// 마을 목록
const villages = ['한신 1', '한신 2', '한신 3', '한신 4', '한신 5', '한신 6', '한신 7'];

// 마을별 사람 목록
const villageMembers: Record<string, string[]> = {
  '한신 1': ['김영희', '이철수', '박지민'],
  '한신 2': ['정민준', '최서연'],
  '한신 3': ['강도현', '윤지우'],
  '한신 4': ['장하은', '송민수'],
  '한신 5': ['이지훈', '김하늘'],
  '한신 6': ['박준호', '최유진'],
  '한신 7': ['정다은', '김태민'],
};

// 샘플 메뉴 데이터
const menuItems: MenuItem[] = [
  {
    id: 1,
    name: '아메리카노',
    description: '깊고 풍부한 에스프레소에 물을 더한 클래식한 커피',
    category: 'coffee',
    image: '/images/americano.jpg',
  },
  {
    id: 2,
    name: '카페 라떼',
    description: '에스프레소와 스팀 밀크의 완벽한 조화',
    category: 'coffee',
    image: '/images/latte.jpg',
  },
  {
    id: 3,
    name: '카푸치노',
    description: '에스프레소, 스팀 밀크, 그리고 풍성한 우유 거품의 조화',
    category: 'coffee',
    image: '/images/cappuccino.jpg',
  },
  {
    id: 4,
    name: '녹차',
    description: '향긋한 녹차의 풍미를 느낄 수 있는 차',
    category: 'tea',
    image: '/images/green-tea.jpg',
  },
  {
    id: 5,
    name: '얼그레이 티',
    description: '베르가못 오일의 향이 특징인 홍차',
    category: 'tea',
    image: '/images/earl-grey.jpg',
  },
  {
    id: 6,
    name: '치즈케이크',
    description: '부드럽고 크리미한 뉴욕 스타일 치즈케이크',
    category: 'dessert',
    image: '/images/cheesecake.jpg',
  },
  {
    id: 7,
    name: '초코 브라우니',
    description: '진한 초콜릿의 맛이 일품인 브라우니',
    category: 'dessert',
    image: '/images/brownie.jpg',
  },
];

export default function CafeMenuPage() {
  const [cart, setCart] = useState<CartItem | null>(null);
  const [village, setVillage] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [isCustomName, setIsCustomName] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [orderStep, setOrderStep] = useState<'info' | 'menu' | 'cart'>('info');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedTemperature, setSelectedTemperature] = useState<'hot' | 'ice' | null>(null);

  // 메뉴 아이템 선택
  const selectMenuItem = (item: MenuItem) => {
    if (cart?.id === item.id) {
      // 이미 선택된 아이템을 다시 클릭하면 선택 취소
      setSelectedItem(null);
      setSelectedTemperature(null);
      setCart(null);
    } else {
      setSelectedItem(item);
      setSelectedTemperature(null);
      // 디저트 카테고리는 온도 선택 없이 바로 카트에 추가
      if (item.category === 'dessert') {
        setCart(item);
        toast.success(`${item.name} 메뉴가 선택되었습니다.`, {
          position: 'top-center',
        });
      }
    }
  };

  // 온도 선택
  const selectTemperature = (temp: 'hot' | 'ice') => {
    if (!selectedItem) return;

    setSelectedTemperature(temp);
    const cartItem = {
      ...selectedItem,
      temperature: temp,
    };
    setCart(cartItem);

    toast.success(
      `${temp === 'hot' ? '따뜻한' : '아이스'} ${selectedItem.name} 메뉴가 선택되었습니다.`,
      {
        position: 'top-center',
      },
    );
  };

  // 카트 비우기
  const clearCart = () => {
    setCart(null);
    setSelectedItem(null);
    setSelectedTemperature(null);
  };

  // 마을 선택 처리
  const selectVillage = (selectedVillage: string) => {
    setVillage(selectedVillage);
    setName(''); // 마을이 변경되면 이름 초기화
    setIsCustomName(false);
    toast.success(`${selectedVillage} 마을이 선택되었습니다.`, {
      position: 'top-center',
    });
  };

  // 이름 선택 처리
  const selectName = (selectedName: string) => {
    if (selectedName === '직접 입력') {
      setIsCustomName(true);
      setName('');
    } else {
      setIsCustomName(false);
      setName(selectedName);
      toast.success(`${selectedName}님으로 선택되었습니다.`, {
        position: 'top-center',
      });
    }
  };

  // 직접 입력한 이름 처리
  const handleCustomNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomName(e.target.value);
  };

  // 직접 입력한 이름 적용
  const applyCustomName = () => {
    if (customName.trim()) {
      setName(customName.trim());
      toast.success(`${customName.trim()}님으로 입력되었습니다.`, {
        position: 'top-center',
      });
    } else {
      toast.error('이름을 입력해주세요.', {
        position: 'top-center',
      });
    }
  };

  // 주문 정보 유효성 검사
  const isOrderInfoValid = () => village !== '' && name !== '';

  // 주문 처리
  const handleOrder = () => {
    if (!isOrderInfoValid()) {
      toast.error('마을과 이름을 입력해주세요.', {
        position: 'top-center',
      });
      setOrderStep('info');
      return;
    }

    if (!cart) {
      toast.error('메뉴를 선택해주세요.', {
        position: 'top-center',
      });
      setOrderStep('menu');
      return;
    }

    // 주문 정보 출력
    const orderDetails = {
      village,
      name,
      isCustomName,
      item: cart.name,
      temperature: cart.temperature,
    };

    console.log('주문 정보:', orderDetails);
    toast.success(`${village} ${name}님의 주문이 완료되었습니다!`, {
      position: 'top-center',
    });

    // 주문 후 초기화
    setCart(null);
    setSelectedItem(null);
    setSelectedTemperature(null);
    setName('');
    setVillage('');
    setIsCustomName(false);
    setCustomName('');
    setOrderStep('info');
  };

  // 다음 단계로 이동
  const goToNextStep = () => {
    if (orderStep === 'info') {
      if (isOrderInfoValid()) {
        setOrderStep('menu');
      } else {
        toast.error('마을과 이름을 입력해주세요.', {
          position: 'top-center',
        });
      }
    } else if (orderStep === 'menu') {
      if (cart) {
        setOrderStep('cart');
      } else {
        toast.error('메뉴를 선택해주세요.', {
          position: 'top-center',
        });
      }
    }
  };

  // 이전 단계로 이동
  const goToPrevStep = () => {
    if (orderStep === 'menu') {
      setOrderStep('info');
    } else if (orderStep === 'cart') {
      setOrderStep('menu');
    }
  };

  return (
    <div className='container mx-auto py-8 pb-24'>
      <h1 className='text-3xl font-bold mb-8 text-center'>카페 메뉴</h1>

      <div className='flex flex-col gap-8'>
        {/* 주문 단계 표시 */}
        <div className='flex justify-center mb-4'>
          <div className='flex items-center'>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${orderStep === 'info' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            >
              1
            </div>
            <div className='w-16 h-1 bg-muted'></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${orderStep === 'menu' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            >
              2
            </div>
            <div className='w-16 h-1 bg-muted'></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${orderStep === 'cart' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            >
              3
            </div>
          </div>
        </div>

        {/* 주문 정보 입력 */}
        {orderStep === 'info' && (
          <Card>
            <CardHeader>
              <CardTitle>주문 정보</CardTitle>
              <CardDescription>주문을 위한 정보를 입력해주세요</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-3'>
                <Label>마을 선택</Label>
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3'>
                  {villages.map((v) => (
                    <Card
                      key={v}
                      className={`cursor-pointer hover:shadow-md transition-shadow ${village === v ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => selectVillage(v)}
                    >
                      <CardHeader className='p-3 text-center'>
                        <CardTitle className='text-sm'>{v}마을</CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
                {village && <p className='text-sm text-muted-foreground'>선택된 마을: {village}</p>}
              </div>

              {village && (
                <div className='space-y-3'>
                  <Label>이름 선택</Label>
                  <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3'>
                    {villageMembers[village]?.map((n) => (
                      <Card
                        key={n}
                        className={`cursor-pointer hover:shadow-md transition-shadow ${!isCustomName && name === n ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => selectName(n)}
                      >
                        <CardHeader className='p-3 text-center'>
                          <CardTitle className='text-sm'>{n}</CardTitle>
                        </CardHeader>
                      </Card>
                    ))}
                    <Card
                      className={`cursor-pointer hover:shadow-md transition-shadow ${isCustomName ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => selectName('직접 입력')}
                    >
                      <CardHeader className='p-3 text-center'>
                        <CardTitle className='text-sm'>직접 입력</CardTitle>
                      </CardHeader>
                    </Card>
                  </div>

                  {isCustomName && (
                    <div className='flex gap-2 mt-2'>
                      <Input
                        placeholder='이름을 입력해주세요'
                        value={customName}
                        onChange={handleCustomNameChange}
                        className='flex-1'
                      />
                      <Button onClick={applyCustomName}>적용</Button>
                    </div>
                  )}

                  {name && !isCustomName && (
                    <p className='text-sm text-muted-foreground'>선택된 이름: {name}</p>
                  )}
                  {name && isCustomName && (
                    <p className='text-sm text-muted-foreground'>입력된 이름: {name}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 메뉴 선택 */}
        {orderStep === 'menu' && (
          <Card>
            <CardHeader>
              <CardTitle>메뉴 선택</CardTitle>
              <CardDescription>원하시는 메뉴를 선택해주세요</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-3'>
                <Label>메뉴</Label>
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
                  {menuItems.map((item) => (
                    <Card
                      key={item.id}
                      className={`cursor-pointer overflow-hidden hover:shadow-md transition-shadow ${selectedItem?.id === item.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => selectMenuItem(item)}
                    >
                      <div className='h-36 bg-gray-200 relative'>
                        <div className='absolute inset-0 flex items-center justify-center text-gray-500'>
                          이미지 준비 중
                        </div>
                      </div>
                      <CardHeader className='p-3 text-center'>
                        <CardTitle className='text-base'>{item.name}</CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>

              {/* 아이스/핫 선택 옵션 */}
              {selectedItem && selectedItem.category !== 'dessert' && (
                <div className='space-y-3'>
                  <Label>온도 선택</Label>
                  <div className='flex gap-4'>
                    <Card
                      className={`cursor-pointer flex-1 hover:shadow-md transition-shadow ${selectedTemperature === 'hot' ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => selectTemperature('hot')}
                    >
                      <CardHeader className='p-4 text-center'>
                        <CardTitle className='text-base'>따뜻하게</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card
                      className={`cursor-pointer flex-1 hover:shadow-md transition-shadow ${selectedTemperature === 'ice' ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => selectTemperature('ice')}
                    >
                      <CardHeader className='p-4 text-center'>
                        <CardTitle className='text-base'>차갑게</CardTitle>
                      </CardHeader>
                    </Card>
                  </div>
                </div>
              )}

              {selectedItem && selectedItem.category === 'dessert' && (
                <div className='mt-4'>
                  <p className='text-sm text-muted-foreground'>선택된 메뉴: {selectedItem.name}</p>
                </div>
              )}

              {selectedItem && selectedItem.category !== 'dessert' && selectedTemperature && (
                <div className='mt-4'>
                  <p className='text-sm text-muted-foreground'>
                    선택된 메뉴: {selectedTemperature === 'hot' ? '따뜻한' : '아이스'}{' '}
                    {selectedItem.name}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 주문 확인 */}
        {orderStep === 'cart' && (
          <Card>
            <CardHeader>
              <CardTitle>주문 확인</CardTitle>
              <CardDescription>주문 내용을 확인해주세요</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-3'>
                <div className='space-y-2 p-4 bg-muted/30 rounded-lg'>
                  <div className='flex flex-col gap-1'>
                    <span>{village}마을</span>
                  </div>

                  <div className='flex flex-col gap-1 mt-3'>
                    <div className='flex items-center gap-2'>
                      <span>{name}</span>
                      {isCustomName && (
                        <span className='text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded'>
                          직접 입력
                        </span>
                      )}
                    </div>
                  </div>
                  {cart && (
                    <div className='flex flex-col gap-1'>
                      <span className='font-medium'>
                        {cart.temperature === 'hot' && '따뜻한 '}
                        {cart.temperature === 'ice' && '아이스 '}
                        {cart.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className='space-y-3'></div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 하단 고정 네비게이션 */}
      <div className='fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg'>
        <div className='container mx-auto p-4'>
          <div className='flex items-center justify-between'>
            {/* 메뉴 선택 단계에서 선택된 메뉴 표시 */}
            {orderStep === 'menu' && cart && (
              <div className='flex items-center gap-4'>
                <div className='bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center'>
                  <span className='text-lg font-semibold'>1</span>
                </div>
                <div>
                  <p className='font-medium'>
                    {cart.temperature === 'hot' && '따뜻한 '}
                    {cart.temperature === 'ice' && '아이스 '}
                    {cart.name}
                  </p>
                </div>
              </div>
            )}

            {/* 메뉴 선택 단계에서 메뉴가 선택되지 않았거나 다른 단계일 경우 현재 단계 표시 */}
            {(orderStep !== 'menu' || !cart) && (
              <div className='flex items-center gap-2'>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground`}
                >
                  {orderStep === 'info' ? '1' : orderStep === 'menu' ? '2' : '3'}
                </div>
                <span className='font-medium'>
                  {orderStep === 'info'
                    ? '주문 정보'
                    : orderStep === 'menu'
                      ? '메뉴 선택'
                      : '주문 확인'}
                </span>
              </div>
            )}

            <div className='flex items-center gap-2'>
              {/* 메뉴 선택 단계에서 메뉴가 선택된 경우 취소 버튼 표시 */}
              {orderStep === 'menu' && cart && (
                <Button variant='outline' size='sm' onClick={clearCart} className='h-9'>
                  취소
                </Button>
              )}

              {/* 이전 단계 버튼 (첫 단계가 아닐 경우) */}
              {orderStep !== 'info' && (
                <Button variant='outline' size='sm' onClick={goToPrevStep} className='h-9 px-3'>
                  <ChevronLeft className='mr-1 h-4 w-4' />
                  이전
                </Button>
              )}

              {/* 다음 단계 또는 주문 완료 버튼 */}
              {orderStep === 'cart' ? (
                <Button size='sm' onClick={handleOrder} className='h-9'>
                  주문 완료
                </Button>
              ) : (
                <Button
                  size='sm'
                  onClick={goToNextStep}
                  disabled={
                    (orderStep === 'info' && !isOrderInfoValid()) || (orderStep === 'menu' && !cart)
                  }
                  className='h-9 px-3'
                >
                  다음
                  <ChevronRight className='ml-1 h-4 w-4' />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Toaster position='top-center' />
    </div>
  );
}
