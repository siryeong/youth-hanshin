'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

// 메뉴 아이템 타입 정의
type MenuItem = {
  id: number;
  name: string;
  description: string;
  category: 'coffee' | 'tea' | 'dessert';
  image: string;
  requiresTemperature: boolean;
};

// 카트 아이템 타입 정의
type CartItem = MenuItem & {
  temperature?: 'hot' | 'ice';
};

// 마을 타입 정의
type Village = {
  id: number;
  name: string;
};

// 마을 주민 타입 정의
type VillageMember = {
  id: number;
  name: string;
};

export default function CafeOrder() {
  const [cart, setCart] = useState<CartItem | null>(null);
  const [village, setVillage] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [isCustomName, setIsCustomName] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [orderStep, setOrderStep] = useState<'info' | 'menu' | 'cart'>('info');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedTemperature, setSelectedTemperature] = useState<'hot' | 'ice' | null>(null);

  // 데이터 상태 추가
  const [villages, setVillages] = useState<Village[]>([]);
  const [villageMembers, setVillageMembers] = useState<Record<string, VillageMember[]>>({});
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 마을 목록 가져오기
  useEffect(() => {
    const fetchVillages = async () => {
      try {
        const response = await fetch('/api/villages');
        if (!response.ok) {
          throw new Error('마을 목록을 가져오는데 실패했습니다.');
        }
        const data = await response.json();
        setVillages(data);
      } catch (err) {
        console.error('마을 목록 조회 오류:', err);
        setError('마을 목록을 불러오는데 문제가 발생했습니다.');
        toast.error('마을 목록을 불러오는데 문제가 발생했습니다.');
      }
    };

    fetchVillages();
  }, []);

  // 메뉴 아이템 가져오기
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await fetch('/api/menu-items');
        if (!response.ok) {
          throw new Error('메뉴 목록을 가져오는데 실패했습니다.');
        }
        const data = await response.json();
        setMenuItems(data);
        setLoading(false);
      } catch (err) {
        console.error('메뉴 목록 조회 오류:', err);
        setError('메뉴 목록을 불러오는데 문제가 발생했습니다.');
        toast.error('메뉴 목록을 불러오는데 문제가 발생했습니다.');
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  // 선택된 마을의 주민 목록 가져오기
  useEffect(() => {
    if (!village) return;

    const fetchVillageMembers = async () => {
      try {
        // 선택된 마을의 ID 찾기
        const selectedVillage = villages.find((v) => v.name === village);
        if (!selectedVillage) return;

        const response = await fetch(`/api/village-members?villageId=${selectedVillage.id}`);
        if (!response.ok) {
          throw new Error('마을 주민 목록을 가져오는데 실패했습니다.');
        }
        const data = await response.json();

        setVillageMembers((prev) => ({
          ...prev,
          [village]: data,
        }));
      } catch (err) {
        console.error('마을 주민 목록 조회 오류:', err);
        toast.error('마을 주민 목록을 불러오는데 문제가 발생했습니다.');
      }
    };

    if (!villageMembers[village]) {
      fetchVillageMembers();
    }
  }, [village, villages, villageMembers]);

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
      // 온도 선택이 필요 없는 메뉴는 바로 카트에 추가
      if (!item.requiresTemperature) {
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
  const handleOrder = async () => {
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

    try {
      // 주문 정보 생성
      const orderData = {
        village,
        name,
        isCustomName,
        menuItemId: cart.id,
        temperature: cart.temperature,
      };

      // API 호출하여 주문 저장
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '주문 처리 중 오류가 발생했습니다.');
      }

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
    } catch (err) {
      console.error('주문 처리 오류:', err);
      toast.error(err instanceof Error ? err.message : '주문 처리 중 오류가 발생했습니다.', {
        position: 'top-center',
      });
    }
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

  // 로딩 중 표시
  if (loading) {
    return (
      <div className='container mx-auto py-8 flex items-center justify-center min-h-[60vh]'>
        <div className='text-center'>
          <p className='text-lg'>데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  // 오류 표시
  if (error) {
    return (
      <div className='container mx-auto py-8 flex items-center justify-center min-h-[60vh]'>
        <div className='text-center'>
          <p className='text-lg text-red-500'>{error}</p>
          <Button className='mt-4' onClick={() => window.location.reload()}>
            새로고침
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
        <div className='hidden sm:block w-[85px]'></div>{' '}
        {/* 데스크탑에서만 균형을 맞추기 위한 빈 공간 */}
      </div>

      <div className='flex flex-col gap-6 sm:gap-8'>
        {/* 주문 단계 표시 */}
        <div className='flex justify-center mb-2 sm:mb-4'>
          <div className='flex items-center'>
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${orderStep === 'info' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            >
              1
            </div>
            <div className='w-10 sm:w-16 h-1 bg-muted'></div>
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${orderStep === 'menu' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            >
              2
            </div>
            <div className='w-10 sm:w-16 h-1 bg-muted'></div>
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${orderStep === 'cart' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            >
              3
            </div>
          </div>
        </div>

        {/* 주문 정보 입력 */}
        {orderStep === 'info' && (
          <Card>
            <CardHeader className='p-4 sm:p-6'>
              <CardTitle>주문 정보</CardTitle>
              <CardDescription>주문을 위한 정보를 입력해주세요</CardDescription>
            </CardHeader>
            <CardContent className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
              <div className='space-y-3'>
                <Label>마을 선택</Label>
                <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 sm:gap-3'>
                  {villages.map((v) => (
                    <Card
                      key={v.id}
                      className={`cursor-pointer hover:shadow-md transition-shadow ${village === v.name ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => selectVillage(v.name)}
                    >
                      <CardHeader className='p-2 sm:p-3 text-center'>
                        <CardTitle className='text-xs sm:text-sm'>{v.name}마을</CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
                {village && (
                  <p className='text-xs sm:text-sm text-muted-foreground'>선택된 마을: {village}</p>
                )}
              </div>

              {village && (
                <div className='space-y-3'>
                  <Label>이름 선택</Label>
                  <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 sm:gap-3'>
                    {villageMembers[village]?.map((member) => (
                      <Card
                        key={member.id}
                        className={`cursor-pointer hover:shadow-md transition-shadow ${!isCustomName && name === member.name ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => selectName(member.name)}
                      >
                        <CardHeader className='p-2 sm:p-3 text-center'>
                          <CardTitle className='text-xs sm:text-sm'>{member.name}</CardTitle>
                        </CardHeader>
                      </Card>
                    ))}
                    <Card
                      className={`cursor-pointer hover:shadow-md transition-shadow ${isCustomName ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => selectName('직접 입력')}
                    >
                      <CardHeader className='p-2 sm:p-3 text-center'>
                        <CardTitle className='text-xs sm:text-sm'>직접 입력</CardTitle>
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
                    <p className='text-xs sm:text-sm text-muted-foreground'>선택된 이름: {name}</p>
                  )}
                  {name && isCustomName && (
                    <p className='text-xs sm:text-sm text-muted-foreground'>입력된 이름: {name}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 메뉴 선택 */}
        {orderStep === 'menu' && (
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
                      className={`cursor-pointer overflow-hidden hover:shadow-md transition-shadow pt-0 ${selectedItem?.id === item.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => selectMenuItem(item)}
                    >
                      <div className='h-24 sm:h-24 bg-gray-200 relative'>
                        <div className='absolute inset-0 flex items-center justify-center text-gray-500 text-xs sm:text-sm'>
                          이미지 준비 중
                        </div>
                      </div>
                      <CardHeader className='p-2 sm:p-3 text-center'>
                        <CardTitle className='text-xs sm:text-sm'>{item.name}</CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>

              {selectedItem && !selectedItem.requiresTemperature && (
                <div className='mt-3 sm:mt-4'>
                  <p className='text-xs sm:text-sm text-muted-foreground'>
                    선택된 메뉴: {selectedItem.name}
                  </p>
                </div>
              )}

              {selectedItem && selectedItem.requiresTemperature && selectedTemperature && (
                <div className='mt-3 sm:mt-4'>
                  <p className='text-xs sm:text-sm text-muted-foreground'>
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
            <CardHeader className='p-4 sm:p-6 pb-2 sm:pb-3'>
              <CardTitle>주문 확인</CardTitle>
              <CardDescription>주문 내용을 확인해주세요</CardDescription>
            </CardHeader>
            <CardContent className='p-4 sm:p-6 pt-2 sm:pt-3 space-y-4'>
              <div className='space-y-3 p-3 sm:p-4 bg-muted/30 rounded-lg'>
                <div className='flex flex-col gap-1'>
                  <span className='text-xs sm:text-sm text-muted-foreground'>마을</span>
                  <span className='text-sm sm:text-base font-medium'>{village}마을</span>
                </div>

                <div className='flex flex-col gap-1'>
                  <span className='text-xs sm:text-sm text-muted-foreground'>이름</span>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm sm:text-base font-medium'>{name}</span>
                    {isCustomName && (
                      <span className='text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded'>
                        직접 입력
                      </span>
                    )}
                  </div>
                </div>

                {cart && (
                  <div className='flex flex-col gap-1'>
                    <span className='text-xs sm:text-sm text-muted-foreground'>메뉴</span>
                    <span className='text-sm sm:text-base font-medium'>
                      {cart.temperature === 'hot' && '따뜻한 '}
                      {cart.temperature === 'ice' && '아이스 '}
                      {cart.name}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 하단 고정 네비게이션 */}
      <div className='fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg flex justify-center'>
        <div className='w-full max-w-screen-lg'>
          {/* 온도 선택 영역 (메뉴 선택 단계에서 온도 선택이 필요한 메뉴가 선택된 경우) */}
          {orderStep === 'menu' && selectedItem && selectedItem.requiresTemperature && (
            <div className='px-3 sm:px-4 py-2 sm:py-3 border-b'>
              <div className='flex flex-col gap-2'>
                <p className='text-xs sm:text-sm text-muted-foreground'>온도를 선택해주세요</p>
                <div className='grid grid-cols-2 gap-2 sm:gap-3'>
                  <Button
                    variant={selectedTemperature === 'hot' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => selectTemperature('hot')}
                    className='h-9 sm:h-10 text-sm sm:text-base w-full'
                  >
                    따뜻하게
                  </Button>
                  <Button
                    variant={selectedTemperature === 'ice' ? 'default' : 'outline'}
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

          <div className='p-3 sm:p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground text-xs sm:text-sm`}
                >
                  {orderStep === 'info' ? '1' : orderStep === 'menu' ? '2' : '3'}
                </div>

                {/* 주문 정보 단계에서 마을이 선택된 경우 마을 이름 표시 */}
                {orderStep === 'info' && village ? (
                  <p className='font-medium text-xs sm:text-sm'>
                    {village}마을 {name && `- ${name}`}
                  </p>
                ) : /* 메뉴 선택 단계에서 메뉴가 선택된 경우 메뉴 이름 표시 */
                orderStep === 'menu' && selectedItem ? (
                  <p className='font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none'>
                    {selectedTemperature === 'hot' && '따뜻한 '}
                    {selectedTemperature === 'ice' && '아이스 '}
                    {selectedItem.name}
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
                {orderStep === 'menu' && selectedItem && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={clearCart}
                    className='h-8 sm:h-9 text-xs sm:text-sm'
                  >
                    취소
                  </Button>
                )}

                {/* 이전 단계 버튼 (첫 단계가 아닐 경우) */}
                {orderStep !== 'info' && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={goToPrevStep}
                    className='h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm'
                  >
                    <ChevronLeft className='mr-0 sm:mr-1 h-3 w-3 sm:h-4 sm:w-4' />
                    <span>이전</span>
                  </Button>
                )}

                {/* 다음 단계 또는 주문 완료 버튼 */}
                {orderStep === 'cart' ? (
                  <Button size='sm' onClick={handleOrder} className='h-8 sm:h-9 text-xs sm:text-sm'>
                    주문 완료
                  </Button>
                ) : (
                  <Button
                    size='sm'
                    onClick={goToNextStep}
                    disabled={
                      (orderStep === 'info' && !isOrderInfoValid()) ||
                      (orderStep === 'menu' && !cart)
                    }
                    className='h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm'
                  >
                    <span>다음</span>
                    <ChevronRight className='ml-0 sm:ml-1 h-3 w-3 sm:h-4 sm:w-4' />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Toaster position='top-center' />
    </div>
  );
}
