'use client';

import { useState, useEffect } from 'react';
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
import { useLoading } from '@/contexts/LoadingContext';
import { useRouter } from 'next/navigation';

// 메뉴 아이템 타입 정의
type MenuItem = {
  id: number;
  name: string;
  description: string;
  category: 'coffee' | 'non coffee';
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

// 카페 영업 시간 정의 (24시간 형식)
// 이 값들은 초기값으로만 사용되고, 실제 값은 API에서 가져옵니다.
const DEFAULT_CAFE_OPENING_HOURS = {
  openingTime: '10:00:00', // 오전 10시
  closingTime: '14:00:00', // 오후 2시
};

// 요일별 영업 여부 (0: 일요일, 1: 월요일, ..., 6: 토요일)
const DEFAULT_CAFE_OPEN_DAYS = [0];

export default function CafeOrder() {
  const [cart, setCart] = useState<CartItem | null>(null);
  const [village, setVillage] = useState<Village | null>(null);
  const [memberName, setMemberName] = useState<string>('');
  const [isCustomName, setIsCustomName] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [orderStep, setOrderStep] = useState<'info' | 'menu' | 'cart'>('info');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedTemperature, setSelectedTemperature] = useState<'hot' | 'ice' | null>(null);
  const [isCafeOpen, setIsCafeOpen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [cafeSettings, setCafeSettings] = useState({
    openingTime: DEFAULT_CAFE_OPENING_HOURS.openingTime,
    closingTime: DEFAULT_CAFE_OPENING_HOURS.closingTime,
    openDays: DEFAULT_CAFE_OPEN_DAYS,
  });
  const [showOrderComplete, setShowOrderComplete] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateOrderInfo, setDuplicateOrderInfo] = useState<{
    id: number;
    menuName: string;
    temperature?: string;
  } | null>(null);
  const [completedOrderInfo, setCompletedOrderInfo] = useState<{
    villageName: string;
    memberName: string;
    menuName: string;
    temperature?: string;
  } | null>(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState<boolean>(false);

  // 데이터 상태 추가
  const [villages, setVillages] = useState<Village[]>([]);
  const [villageMembers, setVillageMembers] = useState<Record<string, VillageMember[]>>({});
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 전역 로딩 상태 사용
  const { setLoadingWithMessage } = useLoading();

  const router = useRouter();

  // 카페 설정 가져오기
  useEffect(() => {
    const fetchCafeSettings = async () => {
      try {
        const response = await fetch('/api/cafe-settings');
        if (!response.ok) {
          throw new Error('카페 설정을 가져오는데 실패했습니다.');
        }
        const data = await response.json();
        setCafeSettings(data);
      } catch (error) {
        console.error('카페 설정 조회 오류:', error);
        // 기본값 사용
      }
    };

    // 초기 설정 가져오기
    fetchCafeSettings();

    // 1분마다 카페 설정 업데이트 (영업시간 변경 확인)
    const settingsInterval = setInterval(fetchCafeSettings, 60000);

    return () => clearInterval(settingsInterval);
  }, []);

  // 카페 영업 시간 확인
  useEffect(() => {
    const checkCafeOpenStatus = () => {
      const now = new Date();
      setCurrentTime(now);

      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentDay = now.getDay();

      // 요일 체크 (영업일인지 확인)
      const isDayOpen = cafeSettings.openDays.includes(currentDay);

      // 시간 체크 (영업 시간인지 확인)
      const parseTimeToMinutes = (timeString: string): number => {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + (minutes || 0);
      };

      const openingMinutes = parseTimeToMinutes(cafeSettings.openingTime);
      const closingMinutes = parseTimeToMinutes(cafeSettings.closingTime);
      const currentMinutes = currentHour * 60 + currentMinute;

      const isTimeOpen = currentMinutes >= openingMinutes && currentMinutes < closingMinutes;

      setIsCafeOpen(isDayOpen && isTimeOpen);
    };

    // 초기 확인
    checkCafeOpenStatus();

    // 5초마다 영업 상태 업데이트
    const interval = setInterval(checkCafeOpenStatus, 5000);

    return () => clearInterval(interval);
  }, [cafeSettings]);

  // 마을 목록 가져오기
  useEffect(() => {
    const fetchVillages = async () => {
      setLoadingWithMessage(true, '마을 목록을 불러오고 있습니다...');
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
      } finally {
        setLoadingWithMessage(false);
      }
    };

    fetchVillages();
  }, [setLoadingWithMessage]);

  // 메뉴 아이템 가져오기
  useEffect(() => {
    const fetchMenuItems = async () => {
      setLoadingWithMessage(true, '메뉴 정보를 불러오고 있습니다...');
      try {
        const response = await fetch('/api/menu-items');
        if (!response.ok) {
          throw new Error('메뉴 목록을 가져오는데 실패했습니다.');
        }
        const data = await response.json();
        setMenuItems(data);
      } catch (err) {
        console.error('메뉴 목록 조회 오류:', err);
        setError('메뉴 목록을 불러오는데 문제가 발생했습니다.');
        toast.error('메뉴 목록을 불러오는데 문제가 발생했습니다.');
      } finally {
        setLoadingWithMessage(false);
      }
    };

    fetchMenuItems();
  }, [setLoadingWithMessage]);

  // 선택된 마을의 주민 목록 가져오기
  useEffect(() => {
    if (!village) return;

    const fetchVillageMembers = async () => {
      setLoadingWithMessage(true, `${village.name} 마을의 주민 목록을 불러오고 있습니다...`);
      try {
        // 선택된 마을의 ID 찾기
        const selectedVillage = villages.find((v) => v.id === village.id);
        if (!selectedVillage) return;

        const response = await fetch(`/api/village-members?villageId=${selectedVillage.id}`);
        if (!response.ok) {
          throw new Error('마을 주민 목록을 가져오는데 실패했습니다.');
        }
        const data = await response.json();

        setVillageMembers((prev) => ({
          ...prev,
          [village.id]: data,
        }));
      } catch (err) {
        console.error('마을 주민 목록 조회 오류:', err);
        toast.error('마을 주민 목록을 불러오는데 문제가 발생했습니다.');
      } finally {
        setLoadingWithMessage(false);
      }
    };

    if (!villageMembers[village.id]) {
      fetchVillageMembers();
    }
  }, [village, villages, villageMembers, setLoadingWithMessage]);

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
  const selectVillage = (selectedVillage: Village) => {
    setVillage(selectedVillage);
    setMemberName(''); // 마을이 변경되면 이름 초기화
    setIsCustomName(false);
    toast.success(`${selectedVillage.name} 마을이 선택되었습니다.`, {
      position: 'top-center',
    });
  };

  // 이름 선택 처리
  const selectName = (selectedName: string) => {
    if (selectedName === '직접 입력') {
      setIsCustomName(true);
      setMemberName('');
    } else {
      setIsCustomName(false);
      setMemberName(selectedName);
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
      setMemberName(customName.trim());
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
  const isOrderInfoValid = () => village !== null && memberName !== '';

  // 중복 주문 확인
  const checkDuplicateOrder = async (): Promise<boolean> => {
    if (!village || !memberName) return false;

    try {
      setIsProcessingOrder(true);
      // 오늘 날짜의 시작 시간 (00:00:00)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // API 호출하여 오늘 주문 확인
      const response = await fetch(
        `/api/orders/check-duplicate?villageId=${village.id}&memberName=${encodeURIComponent(memberName)}&date=${today.toISOString()}`,
      );

      if (!response.ok) {
        throw new Error('주문 확인 중 오류가 발생했습니다.');
      }

      const data = await response.json();

      // 중복 주문이 있는 경우
      if (data.hasDuplicate && data.order) {
        setDuplicateOrderInfo({
          id: data.order.id,
          menuName: data.order.menuItemName || '알 수 없는 메뉴',
          temperature: data.order.temperature,
        });
        setShowDuplicateWarning(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error('중복 주문 확인 오류:', error);
      return false;
    } finally {
      // 중복 주문 확인 후 처리 중 상태 해제 (중복 주문 경고 모달이 표시되는 경우는 제외)
      if (!showDuplicateWarning) {
        setIsProcessingOrder(false);
      }
    }
  };

  // 기존 주문 업데이트
  const updateExistingOrder = async () => {
    if (!duplicateOrderInfo || !cart || !village) return;

    try {
      setIsProcessingOrder(true);
      setLoadingWithMessage(true, '기존 주문을 업데이트하고 있습니다...');

      // 주문 정보 생성
      const orderData = {
        menuItemId: cart.id,
        temperature: cart.temperature,
      };

      // API 호출하여 주문 업데이트
      const response = await fetch(`/api/orders/${duplicateOrderInfo.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '주문 업데이트 중 오류가 발생했습니다.');
      }

      // 주문 완료 정보 저장
      setCompletedOrderInfo({
        villageName: village.name,
        memberName: memberName,
        menuName: cart.name,
        temperature: cart.temperature,
      });

      // 주문 완료 모달 표시
      setShowDuplicateWarning(false);
      setShowOrderComplete(true);

      // 주문 후 초기화
      setCart(null);
      setSelectedItem(null);
      setSelectedTemperature(null);
      setMemberName('');
      setVillage(null);
      setIsCustomName(false);
      setCustomName('');
      setOrderStep('info');

      toast.success('기존 주문이 성공적으로 업데이트되었습니다.', {
        position: 'top-center',
      });
    } catch (error) {
      console.error('주문 업데이트 오류:', error);
      toast.error(
        error instanceof Error ? error.message : '주문 업데이트 중 오류가 발생했습니다.',
        {
          position: 'top-center',
        },
      );
    } finally {
      setLoadingWithMessage(false);
      setIsProcessingOrder(false);
    }
  };

  // 새 주문 생성 (중복 무시)
  const createNewOrderAnyway = async () => {
    setShowDuplicateWarning(false);
    await processOrder();
  };

  // 중복 주문 경고 모달 닫기
  const closeDuplicateWarning = () => {
    setShowDuplicateWarning(false);
    setIsProcessingOrder(false);
  };

  // 주문 처리 로직 (중복 체크 이후)
  const processOrder = async () => {
    try {
      setIsProcessingOrder(true);
      setLoadingWithMessage(
        true,
        `${village?.name}마을 ${memberName}님의 주문을 처리하고 있습니다...`,
      );

      // 주문 정보 생성
      const orderData = {
        villageId: village?.id,
        memberName: memberName,
        isCustomName,
        menuItemId: cart?.id,
        temperature: cart?.temperature,
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

      // 주문 완료 정보 저장
      setCompletedOrderInfo({
        villageName: village?.name || '',
        memberName: memberName,
        menuName: cart?.name || '',
        temperature: cart?.temperature,
      });

      // 주문 완료 모달 표시
      setShowOrderComplete(true);

      // 주문 후 초기화
      setCart(null);
      setSelectedItem(null);
      setSelectedTemperature(null);
      setMemberName('');
      setVillage(null);
      setIsCustomName(false);
      setCustomName('');
      setOrderStep('info');
    } catch (error) {
      console.error('주문 처리 오류:', error);
      toast.error(error instanceof Error ? error.message : '주문 처리 중 오류가 발생했습니다.', {
        position: 'top-center',
      });
    } finally {
      setLoadingWithMessage(false);
      setIsProcessingOrder(false);
    }
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

    if (!cart) {
      toast.error('메뉴를 선택해주세요.', {
        position: 'top-center',
      });
      setOrderStep('menu');
      return;
    }

    // 중복 주문 확인
    const hasDuplicate = await checkDuplicateOrder();

    // 중복이 없으면 바로 주문 처리
    if (!hasDuplicate) {
      await processOrder();
    }
    // 중복이 있으면 경고 모달이 표시되고, 사용자 선택에 따라 처리됨
  };

  // 새 주문 시작
  const startNewOrder = () => {
    setShowOrderComplete(false);
    // 이미 초기화되어 있으므로 추가 작업 필요 없음
  };

  // 홈으로 이동
  const goToHome = () => {
    router.push('/');
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
      if (cafeSettings.openDays.length === 7) return '매일';
      if (cafeSettings.openDays.length === 0) return '영업일 없음';

      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      return cafeSettings.openDays.map((day) => dayNames[day]).join(', ');
    };

    return (
      <div
        className={`mb-4 p-3 rounded-lg text-sm ${isCafeOpen ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
      >
        <div className='flex items-center justify-between'>
          <div>
            <p className='font-medium'>{isCafeOpen ? '영업 중' : '영업 종료'}</p>
            <p className='text-xs mt-1'>
              주문 가능 시간: {formatOpenDays()} {formatTime(cafeSettings.openingTime)} -{' '}
              {formatTime(cafeSettings.closingTime)}
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
                      className={`cursor-pointer hover:shadow-md transition-shadow ${village?.id === v.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => selectVillage(v)}
                    >
                      <CardHeader className='p-2 sm:p-3 text-center'>
                        <CardTitle className='text-xs sm:text-sm'>{v.name}마을</CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
                {village && (
                  <p className='text-xs sm:text-sm text-muted-foreground'>
                    선택된 마을: {village.name}
                  </p>
                )}
              </div>

              {village && (
                <div className='space-y-3'>
                  <Label>이름 선택</Label>
                  <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 sm:gap-3'>
                    {villageMembers[village.id]?.map((member) => (
                      <Card
                        key={member.id}
                        className={`cursor-pointer hover:shadow-md transition-shadow ${!isCustomName && memberName === member.name ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => selectName(member.name)}
                      >
                        <CardHeader className='p-2 sm:p-3 text-center'>
                          <CardTitle className='text-xs sm:text-sm'>{member.name}</CardTitle>
                        </CardHeader>
                      </Card>
                    ))}
                    <Card
                      className={`bg-gray-50 cursor-pointer hover:shadow-md transition-shadow ${isCustomName ? 'ring-2 ring-primary' : ''}`}
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

                  {memberName && !isCustomName && (
                    <p className='text-xs sm:text-sm text-muted-foreground'>
                      선택된 이름: {memberName}
                    </p>
                  )}
                  {memberName && isCustomName && (
                    <p className='text-xs sm:text-sm text-muted-foreground'>
                      입력된 이름: {memberName}
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
                      className={`cursor-pointer hover:shadow-md transition-shadow ${selectedItem?.id === item.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => selectMenuItem(item)}
                    >
                      <div className='flex items-center p-1.5 sm:p-2'>
                        <div className='w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 mr-2 sm:mr-3 flex-shrink-0 flex items-center justify-center overflow-hidden'>
                          <div className='text-gray-500'>
                            {item.category === 'coffee' && (
                              <Coffee className='w-5 h-5 sm:w-6 sm:h-6' />
                            )}
                            {item.category === 'non coffee' && (
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
                  <span className='text-sm sm:text-base font-medium'>{village?.name}마을</span>
                </div>

                <div className='flex flex-col gap-1'>
                  <span className='text-xs sm:text-sm text-muted-foreground'>이름</span>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm sm:text-base font-medium'>{memberName}</span>
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
                    {village.name}마을 {memberName && `- ${memberName}`}
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
                  <Button
                    size='sm'
                    onClick={handleOrder}
                    disabled={!isCafeOpen}
                    className='h-8 sm:h-9 text-xs sm:text-sm'
                  >
                    <span>{!isCafeOpen ? '영업 시간이 아닙니다' : '주문 완료'}</span>
                  </Button>
                ) : (
                  <Button
                    size='sm'
                    onClick={goToNextStep}
                    disabled={
                      !isCafeOpen ||
                      (orderStep === 'info' && !isOrderInfoValid()) ||
                      (orderStep === 'menu' && !cart)
                    }
                    className='h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm'
                  >
                    <span>{!isCafeOpen ? '영업 시간이 아닙니다' : '다음'}</span>
                    <ChevronRight className='ml-0 sm:ml-1 h-3 w-3 sm:h-4 sm:w-4' />
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
              {village?.name}마을 {memberName}님은 오늘 이미 주문하셨습니다.
            </p>
            <div className='bg-amber-50 p-3 rounded-md mb-6'>
              <p className='font-medium'>기존 주문 내역</p>
              <p>
                {duplicateOrderInfo.temperature === 'ice' && '아이스 '}
                {duplicateOrderInfo.temperature === 'hot' && '따뜻한 '}
                {duplicateOrderInfo.menuName}
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
              {completedOrderInfo.villageName}마을 {completedOrderInfo.memberName}님의 주문이
              완료되었습니다.
            </p>
            <div className='bg-slate-50 p-3 rounded-md mb-6'>
              <p className='font-medium'>주문 내역</p>
              <p>
                {completedOrderInfo.temperature === 'ice' && '아이스 '}
                {completedOrderInfo.temperature === 'hot' && '따뜻한 '}
                {completedOrderInfo.menuName}
              </p>
            </div>
            <div className='flex flex-col gap-3'>
              <Button onClick={startNewOrder} className='w-full' variant='outline'>
                새로운 주문 작성하기
              </Button>
              <Button onClick={goToHome} className='w-full'>
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
