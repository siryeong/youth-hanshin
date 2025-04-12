'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Coffee,
  CupSoda,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CafeMenuItem,
  CafeSetting,
  Village,
  Member,
  TemperatureType,
  StrengthType,
  CafeOrder,
} from '@/model/model';
import { fetchCafeSettings } from '@/fetch/CafeSettings';
import { parseTimeFromDate, parseTimeToSeconds } from '@/lib/timeUtil';
import { fetchVillages } from '@/fetch/Village';
import { fetchCafeMenuItems } from '@/fetch/CafeMenuItem';
import { useRequest } from '@/fetch/Request';
import { createOrder, fetchDuplicateOrder, updateOrder } from '@/fetch/CafeOrder';

interface OrderInfo {
  cafeMenuItem: CafeMenuItem | null;
  village: Village | null;
  member: Member | null;
  customName: string | null;
  options: {
    temperature: TemperatureType;
    strength: StrengthType;
  };
}

export default function CafeOrderPage() {
  // 주문 정보
  const [orderInfo, setOrderInfo] = useState<OrderInfo>({
    cafeMenuItem: null,
    village: null,
    member: null,
    customName: null,
    options: { temperature: null, strength: null },
  });
  const [isCustomName, setIsCustomName] = useState<boolean>(false);

  // 상태 관리
  const [orderStep, setOrderStep] = useState<'info' | 'menu' | 'cart'>('info');
  const [isCafeOpen, setIsCafeOpen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [cafeSetting, setCafeSetting] = useState<CafeSetting>({
    id: 0,
    openingTime: '10:00:00',
    closingTime: '14:15:00',
    openDays: [0],
    createdAt: '',
    updatedAt: '',
  });
  const [showOrderComplete, setShowOrderComplete] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateOrderInfo, setDuplicateOrderInfo] = useState<CafeOrder | null>(null);
  const [completedOrderInfo, setCompletedOrderInfo] = useState<CafeOrder | null>(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState<boolean>(false);

  // 데이터 상태 추가
  const [villages, setVillages] = useState<Village[]>([]);
  const [menuItems, setMenuItems] = useState<CafeMenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { request, requestAll } = useRequest();

  const router = useRouter();

  // 데이터 불러오기
  useEffect(() => {
    requestAll([
      () => fetchVillages(true),
      () => fetchCafeMenuItems(),
      () => fetchCafeSettings(),
    ]).then(({ data, error }) => {
      if (data) {
        const [villages, menuItems, cafeSetting] = data;
        setVillages(villages);
        setMenuItems(menuItems);
        setCafeSetting(cafeSetting);

        const nowDate = new Date();
        setCurrentTime(nowDate);
        const currentTimeSeconds = parseTimeToSeconds(parseTimeFromDate(nowDate));
        const openingTimeSeconds = parseTimeToSeconds(cafeSetting.openingTime);
        const closingTimeSeconds = parseTimeToSeconds(cafeSetting.closingTime);
        const isOpenDays = cafeSetting.openDays.includes(nowDate.getDay());
        const isOpenTime =
          currentTimeSeconds >= openingTimeSeconds && currentTimeSeconds < closingTimeSeconds;
        setIsCafeOpen(isOpenDays && isOpenTime);
      } else {
        setError(error?.message || '데이터를 불러오는 중 오류가 발생했습니다.');
      }
    });

    // 60초마다 카페 설정 업데이트 (영업시간 변경 확인)
    const settingsInterval = setInterval(async () => {
      const cafeSetting = await fetchCafeSettings();
      setCafeSetting(cafeSetting);

      const nowDate = new Date();
      setCurrentTime(nowDate);
      const currentTimeSeconds = parseTimeToSeconds(parseTimeFromDate(nowDate));
      const openingTimeSeconds = parseTimeToSeconds(cafeSetting.openingTime);
      const closingTimeSeconds = parseTimeToSeconds(cafeSetting.closingTime);
      const isOpenDays = cafeSetting.openDays.includes(nowDate.getDay());
      const isOpenTime =
        currentTimeSeconds >= openingTimeSeconds && currentTimeSeconds < closingTimeSeconds;
      setIsCafeOpen(isOpenDays && isOpenTime);
    }, 60000);
    return () => clearInterval(settingsInterval);
  }, [requestAll]);

  // 메뉴 아이템 선택
  const selectMenuItem = (item: CafeMenuItem) => {
    if (orderInfo.cafeMenuItem?.id === item.id) {
      setOrderInfo({ ...orderInfo, cafeMenuItem: null });
    } else {
      setOrderInfo({ ...orderInfo, cafeMenuItem: item });
    }
  };

  // 동적 스페이서 높이 계산 함수
  const spacerHeight = useMemo(() => {
    // 기본 높이 (하단 바만 있을 때)
    let height = 0; // 기본 하단 바 높이

    // 온도 선택 영역이 표시되는 경우 추가 높이
    if (
      orderStep === 'menu' &&
      orderInfo.cafeMenuItem &&
      orderInfo.cafeMenuItem.requiredOptions.temperature
    ) {
      height += 64; // 온도 선택 영역 높이
    }

    // 연하게 옵션이 표시되는 경우 추가 높이
    if (
      orderStep === 'menu' &&
      orderInfo.cafeMenuItem &&
      orderInfo.cafeMenuItem.requiredOptions.strength
    ) {
      height += 64; // 연하게 옵션 영역 높이
    }

    return `${height}px`;
  }, [orderStep, orderInfo.cafeMenuItem]);

  // 온도 선택
  const selectTemperature = (temp: TemperatureType) => {
    if (!orderInfo.cafeMenuItem) return;
    setOrderInfo({
      ...orderInfo,
      options: {
        ...orderInfo.options,
        temperature: temp,
      },
    });
  };

  // 카트 비우기
  const clearCart = () => {
    setOrderInfo({ ...orderInfo, cafeMenuItem: null });
  };

  // 마을 선택 처리
  const selectVillage = (selectedVillage: Village) => {
    setOrderInfo({ ...orderInfo, village: selectedVillage });
    setIsCustomName(false);
  };

  // 멤버 선택 처리
  const selectMember = (member: Member | null) => {
    if (!member) {
      setIsCustomName(true);
      setOrderInfo({ ...orderInfo, customName: '', member: null });
      return;
    } else {
      setIsCustomName(false);
      setOrderInfo({ ...orderInfo, customName: null, member: member });
    }
  };

  // 직접 입력한 이름 처리
  const handleCustomNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderInfo({ ...orderInfo, customName: e.target.value });
  };

  // 직접 입력한 이름 적용
  const applyCustomName = () => {
    if (orderInfo.customName?.trim()) {
      setOrderInfo({ ...orderInfo, customName: orderInfo.customName.trim() });
      toast.success(`${orderInfo.customName?.trim()}님으로 입력되었습니다.`, {
        position: 'top-center',
      });
    } else {
      toast.error('이름을 입력해주세요.', {
        position: 'top-center',
      });
    }
  };

  // 주문 정보 유효성 검사
  const isOrderInfoValid = () =>
    orderInfo.village !== null && (orderInfo.member !== null || orderInfo.customName !== null);

  // 중복 주문 경고 모달 닫기
  const closeDuplicateWarning = () => {
    setShowDuplicateWarning(false);
    setIsProcessingOrder(false);
  };

  // 주문 처리 로직
  const processOrder = () => {
    if (!orderInfo.village || !orderInfo.cafeMenuItem) return;
    request(() => createOrder(orderInfo as CafeOrder))
      .then(({ data }) => {
        if (data) {
          setCompletedOrderInfo(data);
          setShowOrderComplete(true);
        }

        setOrderInfo({
          cafeMenuItem: null,
          village: null,
          member: null,
          customName: null,
          options: { temperature: null, strength: null },
        });
        setOrderStep('info');
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : '주문 처리 중 오류가 발생했습니다.', {
          position: 'top-center',
        });
      });
  };

  // 새 주문 생성 (중복 무시)
  const createNewOrderAnyway = () => {
    setShowDuplicateWarning(false);
    processOrder();
  };

  // 기존 주문 업데이트
  const updateExistingOrder = () => {
    if (!duplicateOrderInfo || !orderInfo.cafeMenuItem || !orderInfo.village) return;
    if (!orderInfo.member && !orderInfo.customName) return;

    request(() => updateOrder(duplicateOrderInfo))
      .then(({ data }) => {
        if (data) {
          setCompletedOrderInfo(data);
          setShowDuplicateWarning(false);
          setShowOrderComplete(true);
        }
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : '주문 업데이트 중 오류가 발생했습니다.',
          {
            position: 'top-center',
          },
        );
      });
  };

  // 주문 처리
  const handleOrder = async () => {
    // 이미 주문 처리 중이면 중복 요청 방지
    if (isProcessingOrder) {
      return;
    }

    // 카페가 닫혀있으면 주문 불가
    if (!isCafeOpen) {
      toast.error('카페 영업 시간이 아닙니다. 영업 시간에 다시 시도해주세요.', {
        position: 'top-center',
      });
      return;
    }

    if (!isOrderInfoValid()) {
      toast.error('마을과 이름을 입력해주세요.', {
        position: 'top-center',
      });
      setOrderStep('info');
      return;
    }

    if (!orderInfo.cafeMenuItem) {
      toast.error('메뉴를 선택해주세요.', {
        position: 'top-center',
      });
      setOrderStep('menu');
      return;
    }

    // 중복 주문 확인
    const duplicateOrders = await fetchDuplicateOrder(
      orderInfo.village?.id,
      orderInfo.member?.id,
      orderInfo.customName || undefined,
    );

    if (duplicateOrders.length > 0) {
      setDuplicateOrderInfo(duplicateOrders[0]);
      setShowDuplicateWarning(true);
      return;
    }

    // 중복이 없으면 바로 주문 처리
    processOrder();
  };

  // 새 주문 시작
  const startNewOrder = () => {
    setShowOrderComplete(false);
    // 이미 초기화되어 있으므로 추가 작업 필요 없음
  };

  // 다음 단계로 이동
  const goToNextStep = () => {
    // 카페가 닫혀있으면 진행 불가
    if (!isCafeOpen) {
      toast.error('카페 영업 시간이 아닙니다. 영업 시간에 다시 시도해주세요.', {
        position: 'top-center',
      });
      return;
    }

    if (orderStep === 'info') {
      if (isOrderInfoValid()) {
        setOrderStep('menu');
      } else {
        toast.error('마을과 이름을 입력해주세요.', {
          position: 'top-center',
        });
      }
    } else if (orderStep === 'menu') {
      if (orderInfo.cafeMenuItem) {
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

  // 카페 영업 시간 표시 함수
  const renderOpeningHours = () => {
    const formatTime = (timeString: string) => {
      if (!timeString) return '';

      const [hourStr, minuteStr] = timeString.split(':');
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);

      const period = hour < 12 ? '오전' : '오후';
      const displayHour = hour === 12 ? 12 : hour % 12;
      const minuteStr2 = minute === 0 ? '' : ` ${minute}분`;

      return `${period} ${displayHour}시${minuteStr2}`;
    };

    // 영업일 표시
    const formatOpenDays = () => {
      if (cafeSetting.openDays.length === 7) return '매일';
      if (cafeSetting.openDays.length === 0) return '영업일 없음';

      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      return cafeSetting.openDays.map((day) => dayNames[day]).join(', ');
    };

    return (
      <div
        className={`mb-4 p-3 rounded-lg text-sm ${isCafeOpen ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
      >
        <div className='flex items-center justify-between'>
          <div>
            <p className='font-medium'>{isCafeOpen ? '영업 중' : '영업 종료'}</p>
            <p className='text-xs mt-1'>
              주문 가능 시간: {formatOpenDays()} {formatTime(cafeSetting.openingTime)} -{' '}
              {formatTime(cafeSetting.closingTime)}
            </p>
          </div>
          <div className='text-right'>
            <p className='text-xs'>
              현재 시간:{' '}
              {currentTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>
    );
  };

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

      {/* 카페 영업 시간 정보 표시 */}
      {renderOpeningHours()}

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
                      className={`cursor-pointer hover:shadow-md transition-shadow ${orderInfo.village?.id === v.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => selectVillage(v)}
                    >
                      <CardHeader className='p-2 sm:p-3 text-center'>
                        <CardTitle className='text-xs sm:text-sm'>{v.name}마을</CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
                {orderInfo.village && (
                  <p className='text-xs sm:text-sm text-muted-foreground'>
                    선택된 마을: {orderInfo.village.name}
                  </p>
                )}
              </div>

              {orderInfo.village && (
                <div className='space-y-3'>
                  <Label>이름 선택</Label>
                  <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 sm:gap-3'>
                    {orderInfo.village.members.map((member) => (
                      <Card
                        key={member.id}
                        className={`cursor-pointer hover:shadow-md transition-shadow ${!isCustomName && orderInfo.member?.name === member.name ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => selectMember(member)}
                      >
                        <CardHeader className='p-2 sm:p-3 text-center'>
                          <CardTitle className='text-xs sm:text-sm'>{member.name}</CardTitle>
                        </CardHeader>
                      </Card>
                    ))}
                    <Card
                      className={`bg-gray-50 cursor-pointer hover:shadow-md transition-shadow ${isCustomName ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => selectMember(null)}
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
                        value={orderInfo.customName || ''}
                        onChange={handleCustomNameChange}
                        className='flex-1'
                      />
                      <Button onClick={applyCustomName}>적용</Button>
                    </div>
                  )}

                  {orderInfo.member && !isCustomName && (
                    <p className='text-xs sm:text-sm text-muted-foreground'>
                      선택된 이름: {orderInfo.member.name}
                    </p>
                  )}
                  {orderInfo.customName && isCustomName && (
                    <p className='text-xs sm:text-sm text-muted-foreground'>
                      입력된 이름: {orderInfo.customName}
                    </p>
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
                      className={`cursor-pointer hover:shadow-md transition-shadow ${orderInfo.cafeMenuItem?.id === item.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => selectMenuItem(item)}
                    >
                      <div className='flex items-center p-1.5 sm:p-2'>
                        <div className='w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 mr-2 sm:mr-3 flex-shrink-0 flex items-center justify-center overflow-hidden'>
                          <div className='text-gray-500'>
                            {item.category === 'coffee' && (
                              <Coffee className='w-5 h-5 sm:w-6 sm:h-6' />
                            )}
                            {item.category === 'tea' && (
                              <CupSoda className='w-5 h-5 sm:w-6 sm:h-6' />
                            )}
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
                  <span className='text-sm sm:text-base font-medium'>
                    {orderInfo.village?.name}마을
                  </span>
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
        )}
      </div>

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
                    disabled={!isCafeOpen}
                    className='h-11 sm:h-12 px-4 sm:px-5 text-sm sm:text-base'
                  >
                    <span>{!isCafeOpen ? '영업 시간이 아닙니다' : '주문 완료'}</span>
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

      {/* 중복 주문 경고 모달 */}
      {showDuplicateWarning && duplicateOrderInfo && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4 text-center'>
            <div className='flex justify-center mb-4'>
              <AlertTriangle className='h-16 w-16 text-amber-500' />
            </div>
            <h2 className='text-xl font-bold mb-2'>중복 주문 감지됨</h2>
            <p className='mb-4'>
              {duplicateOrderInfo.village.name}마을{' '}
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
              <Button onClick={updateExistingOrder} className='w-full' variant='outline'>
                기존 주문 변경하기
              </Button>
              <Button onClick={createNewOrderAnyway} className='w-full'>
                새로운 주문으로 추가하기
              </Button>
              <Button onClick={closeDuplicateWarning} className='w-full mt-2' variant='ghost'>
                취소
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 주문 완료 모달 */}
      {showOrderComplete && completedOrderInfo && (
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
              <Button onClick={startNewOrder} className='w-full' variant='outline'>
                새로운 주문 작성하기
              </Button>
              <Button onClick={() => router.push('/')} className='w-full'>
                홈으로 이동하기
              </Button>
            </div>
          </div>
        </div>
      )}

      <Toaster position='top-center' />
    </div>
  );
}
