'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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

export interface OrderInfo {
  cafeMenuItem: CafeMenuItem | null;
  village: Village | null;
  member: Member | null;
  customName: string | null;
  options: {
    temperature: TemperatureType;
    strength: StrengthType;
  };
}

export function useCafeOrder() {
  const router = useRouter();
  const { request, requestAll } = useRequest();

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

  // 데이터 상태
  const [villages, setVillages] = useState<Village[]>([]);
  const [menuItems, setMenuItems] = useState<CafeMenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  // 동적 스페이서 높이 계산 함수
  const spacerHeight = useMemo(() => {
    let height = 0;

    if (
      orderStep === 'menu' &&
      orderInfo.cafeMenuItem &&
      orderInfo.cafeMenuItem.requiredOptions.temperature
    ) {
      height += 64;
    }

    if (
      orderStep === 'menu' &&
      orderInfo.cafeMenuItem &&
      orderInfo.cafeMenuItem.requiredOptions.strength
    ) {
      height += 64;
    }

    return `${height}px`;
  }, [orderStep, orderInfo.cafeMenuItem]);

  // 메뉴 아이템 선택
  const selectMenuItem = (item: CafeMenuItem) => {
    if (orderInfo.cafeMenuItem?.id === item.id) {
      setOrderInfo({ ...orderInfo, cafeMenuItem: null });
    } else {
      setOrderInfo({ ...orderInfo, cafeMenuItem: item });
    }
  };

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
    request(() => createOrder(orderInfo as CafeOrder), {
      loadingMessage: '주문을 생성하고 있습니다...',
      showErrorToast: false, // 에러는 직접 처리
    })
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
      })
      .finally(() => {
        setIsProcessingOrder(false);
      });
  };

  // 새 주문 생성 (중복 무시)
  const createNewOrderAnyway = async () => {
    setShowDuplicateWarning(false);

    if (!orderInfo.village || !orderInfo.cafeMenuItem) return;

    return new Promise<void>((resolve, reject) => {
      request(() => createOrder(orderInfo as CafeOrder), {
        loadingMessage: '새 주문을 생성하고 있습니다...',
        showErrorToast: false, // 에러는 직접 처리
      })
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
          resolve();
        })
        .catch((error) => {
          toast.error(
            error instanceof Error ? error.message : '주문 처리 중 오류가 발생했습니다.',
            {
              position: 'top-center',
            },
          );
          reject(error);
        })
        .finally(() => {
          setIsProcessingOrder(false);
        });
    });
  };

  // 기존 주문 업데이트
  const updateExistingOrder = async () => {
    if (!duplicateOrderInfo || !orderInfo.cafeMenuItem || !orderInfo.village) return;
    if (!orderInfo.member && !orderInfo.customName) return;

    return new Promise<void>((resolve, reject) => {
      request(() => updateOrder(duplicateOrderInfo), {
        loadingMessage: '기존 주문을 업데이트하고 있습니다...',
        showErrorToast: false, // 에러는 직접 처리
      })
        .then(({ data }) => {
          if (data) {
            setCompletedOrderInfo(data);
            setShowDuplicateWarning(false);
            setShowOrderComplete(true);
          }
          resolve();
        })
        .catch((error) => {
          toast.error(
            error instanceof Error ? error.message : '주문 업데이트 중 오류가 발생했습니다.',
            {
              position: 'top-center',
            },
          );
          reject(error);
        })
        .finally(() => {
          setIsProcessingOrder(false);
        });
    });
  };

  // 주문 처리
  const handleOrder = async () => {
    // 이미 주문 처리 중이면 중복 요청 방지
    if (isProcessingOrder) {
      toast.warning('주문 처리 중입니다. 잠시만 기다려주세요.', {
        position: 'top-center',
      });
      return;
    }

    setIsProcessingOrder(true);

    try {
      // 카페가 닫혀있으면 주문 불가
      if (!isCafeOpen) {
        toast.error('카페 영업 시간이 아닙니다. 영업 시간에 다시 시도해주세요.', {
          position: 'top-center',
        });
        setIsProcessingOrder(false);
        return;
      }

      if (!isOrderInfoValid()) {
        toast.error('마을과 이름을 입력해주세요.', {
          position: 'top-center',
        });
        setOrderStep('info');
        setIsProcessingOrder(false);
        return;
      }

      if (!orderInfo.cafeMenuItem) {
        toast.error('메뉴를 선택해주세요.', {
          position: 'top-center',
        });
        setOrderStep('menu');
        setIsProcessingOrder(false);
        return;
      }

      // 중복 주문 확인 (request 함수 사용하여 전역 로딩 상태 적용)
      const { data: duplicateOrders, error: duplicateError } = await request(
        () =>
          fetchDuplicateOrder(
            orderInfo.village?.id,
            orderInfo.member?.id,
            orderInfo.customName || undefined,
          ),
        {
          loadingMessage: '중복 주문을 확인하고 있습니다...',
          showErrorToast: false, // 에러는 직접 처리
        },
      );

      if (duplicateError) {
        setIsProcessingOrder(false);
        toast.error('중복 주문 확인 중 오류가 발생했습니다.', {
          position: 'top-center',
        });
        return;
      }

      if (duplicateOrders && duplicateOrders.length > 0) {
        setDuplicateOrderInfo(duplicateOrders[0]);
        setShowDuplicateWarning(true);
        setIsProcessingOrder(false);
        return;
      }

      // 중복이 없으면 바로 주문 처리
      processOrder();
    } catch (err) {
      setIsProcessingOrder(false);
      toast.error(err instanceof Error ? err.message : '주문 처리 중 오류가 발생했습니다.', {
        position: 'top-center',
      });
    }
  };

  // 새 주문 시작
  const startNewOrder = async () => {
    // 모달 닫기
    setShowOrderComplete(false);

    // 모든 주문 정보 초기화
    setOrderInfo({
      cafeMenuItem: null,
      village: null,
      member: null,
      customName: null,
      options: { temperature: null, strength: null },
    });

    // 이름 입력 방식 초기화
    setIsCustomName(false);

    // 첫 번째 단계로 이동
    setOrderStep('info');

    // 처리 상태 초기화
    setIsProcessingOrder(false);
  };

  // 홈으로 이동
  const goHome = async () => {
    router.push('/');
  };

  // 다음 단계로 이동
  const goToNextStep = () => {
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

  return {
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
    router,
  };
}
