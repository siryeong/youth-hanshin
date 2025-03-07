'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, RefreshCw } from 'lucide-react';

import { Order } from '@/lib/supabase';

type VillageSummary = {
  id: number;
  name: string;
  orders: Order[];
  pending: number;
  processing: number;
  completed: number;
  cancelled: number;
  total: number;
};

export default function OrderStatusPage() {
  const [villageSummaries, setVillageSummaries] = useState<VillageSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  // 주문 상태에 따른 배경색 클래스
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 주문 상태 한글 표시
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '대기 중';
      case 'processing':
        return '처리 중';
      case 'completed':
        return '완료';
      case 'cancelled':
        return '취소됨';
      default:
        return status;
    }
  };

  // 오늘 날짜인지 확인하는 함수
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  // 데이터 가져오기
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 오늘의 주문 데이터 가져오기
      const ordersResponse = await fetch('/api/orders');
      if (!ordersResponse.ok) {
        throw new Error('주문 데이터를 불러오는데 실패했습니다.');
      }
      const ordersData = await ordersResponse.json();

      // 오늘 주문만 필터링
      const todayOrders = ordersData.filter((order: Order) => isToday(order.createdAt.toString()));

      // 마을 데이터 가져오기
      const villagesResponse = await fetch('/api/villages');
      if (!villagesResponse.ok) {
        throw new Error('마을 데이터를 불러오는데 실패했습니다.');
      }
      const villagesData = await villagesResponse.json();

      // 마을별 주문 요약 생성
      const summaries: VillageSummary[] = villagesData.map(
        (village: { id: number; name: string }) => {
          const villageOrders = todayOrders.filter(
            (order: Order) => order.villageId === village.id,
          );

          // 상태별 주문 수 계산
          const pending = villageOrders.filter((order: Order) => order.status === 'pending').length;
          const processing = villageOrders.filter(
            (order: Order) => order.status === 'processing',
          ).length;
          const completed = villageOrders.filter(
            (order: Order) => order.status === 'completed',
          ).length;
          const cancelled = villageOrders.filter(
            (order: Order) => order.status === 'cancelled',
          ).length;

          return {
            id: village.id,
            name: village.name,
            orders: villageOrders,
            pending,
            processing,
            completed,
            cancelled,
            total: villageOrders.length,
          };
        },
      );

      // 주문이 있는 마을을 먼저 보여주고, 주문 수가 많은 순으로 정렬
      summaries.sort((a, b) => {
        if (a.total === 0 && b.total > 0) return 1;
        if (a.total > 0 && b.total === 0) return -1;
        return b.total - a.total;
      });

      setVillageSummaries(summaries);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('데이터 로딩 오류:', err);
      setError(err instanceof Error ? err.message : '데이터를 불러오는데 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchData();

    // 30초마다 자동 새로고침
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className='container mx-auto py-6'>
      <div className='flex flex-col sm:flex-row justify-between items-center mb-6 gap-4'>
        <div className='flex items-center gap-2'>
          <Link href='/'>
            <Button variant='outline' size='sm' className='flex items-center gap-2'>
              <Home className='h-4 w-4' />
              홈으로
            </Button>
          </Link>
        </div>
        <h1 className='text-2xl sm:text-3xl font-bold'>오늘의 마을별 주문 현황</h1>
        <Button
          variant='outline'
          size='sm'
          onClick={fetchData}
          disabled={isLoading}
          className='flex items-center gap-2'
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      <div className='text-sm text-muted-foreground text-right mb-4'>
        마지막 업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}
        <span className='text-xs ml-2'>(30초마다 자동 업데이트)</span>
      </div>

      {error && (
        <div className='bg-red-50 text-red-700 p-4 rounded-md mb-6'>
          <p className='font-medium'>오류 발생</p>
          <p>{error}</p>
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {villageSummaries.map((village) => (
          <Card key={village.id} className={village.total > 0 ? 'border-primary/20' : ''}>
            <CardContent className='p-6'>
              <div className='flex justify-between items-start mb-4'>
                <div>
                  <h2 className='text-xl font-bold'>{village.name}마을</h2>
                  <p className='text-sm text-muted-foreground'>총 {village.total}건의 주문</p>
                </div>
                {village.total > 0 && (
                  <div className='flex gap-1'>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColorClass('pending')}`}
                    >
                      {village.pending}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColorClass('processing')}`}
                    >
                      {village.processing}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColorClass('completed')}`}
                    >
                      {village.completed}
                    </span>
                  </div>
                )}
              </div>

              {village.total > 0 ? (
                <div className='space-y-3 max-h-80 overflow-y-auto pr-1'>
                  {village.orders.map((order) => (
                    <div
                      key={order.id}
                      className={`p-3 rounded-md border ${
                        order.status === 'completed'
                          ? 'bg-green-50/50'
                          : order.status === 'cancelled'
                            ? 'bg-red-50/50'
                            : order.status === 'processing'
                              ? 'bg-blue-50/50'
                              : 'bg-yellow-50/50'
                      }`}
                    >
                      <div className='flex justify-between'>
                        <span className='font-medium'>{order.memberName}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getStatusColorClass(order.status)}`}
                        >
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <div className='mt-1 text-sm'>
                        {order.temperature === 'ice' && '아이스 '}
                        {order.temperature === 'hot' && '따뜻한 '}
                        {order.menuItem.name}
                      </div>
                      <div className='mt-1 text-xs text-muted-foreground'>
                        {formatTime(order.createdAt.toString())} 주문
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='py-8 text-center text-muted-foreground'>
                  오늘 주문 내역이 없습니다.
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
