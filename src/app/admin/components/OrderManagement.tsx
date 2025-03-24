'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClipboardCopy } from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface Order {
  id: number;
  villageId: number;
  villageName?: string;
  memberName: string;
  isCustomName: boolean;
  menuItemId: number;
  menuItemName?: string;
  isMild: boolean;
  temperature?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Village {
  id: number;
  name: string;
}

interface MenuItem {
  id: number;
  name: string;
  categoryId: number;
  categoryName?: string;
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterVillageId, setFilterVillageId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showVillageSummary, setShowVillageSummary] = useState(false);

  // 주문 목록 불러오기
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/orders');
      if (!response.ok) throw new Error('주문 목록을 불러오는데 실패했습니다.');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('주문 목록 불러오기 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 마을 목록 불러오기
  const fetchVillages = async () => {
    try {
      const response = await fetch('/api/admin/villages');
      if (!response.ok) throw new Error('마을 목록을 불러오는데 실패했습니다.');
      const data = await response.json();
      setVillages(data);
    } catch (error) {
      console.error('마을 목록 불러오기 오류:', error);
    }
  };

  // 메뉴 아이템 목록 불러오기
  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/admin/menu/items');
      if (!response.ok) throw new Error('메뉴 아이템 목록을 불러오는데 실패했습니다.');
      const data = await response.json();
      setMenuItems(data);
    } catch (error) {
      console.error('메뉴 아이템 목록 불러오기 오류:', error);
    }
  };

  // 컴포넌트 마운트 시 데이터 불러오기
  useEffect(() => {
    fetchOrders();
    fetchVillages();
    fetchMenuItems();
  }, []);

  // 주문 상태 변경
  const updateOrderStatus = async (id: number, status: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('주문 상태 변경에 실패했습니다.');

      await fetchOrders();
    } catch (error) {
      console.error('주문 상태 변경 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 주문 삭제
  const deleteOrder = async (id: number) => {
    if (!confirm('정말로 이 주문을 삭제하시겠습니까?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('주문 삭제에 실패했습니다.');

      await fetchOrders();
    } catch (error) {
      console.error('주문 삭제 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 마을 이름 가져오기
  const getVillageName = (villageId: number) => {
    const village = villages.find((v) => v.id === villageId);
    return village ? village.name : '알 수 없음';
  };

  // 메뉴 아이템 이름 가져오기
  const getMenuItemName = (menuItemId: number) => {
    const menuItem = menuItems.find((m) => m.id === menuItemId);
    return menuItem ? menuItem.name : '알 수 없음';
  };

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

  // 필터링된 주문 목록
  const filteredOrders = orders.filter((order) => {
    if (filterVillageId !== 'all' && order.villageId !== parseInt(filterVillageId)) {
      return false;
    }
    if (filterStatus !== 'all' && order.status !== filterStatus) {
      return false;
    }
    return true;
  });

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

  // 오늘 들어온 주문만 필터링
  const todayOrders = orders.filter((order) => isToday(order.createdAt));

  // 마을별 주문 집계
  const villageSummary = todayOrders.reduce(
    (acc, order) => {
      const villageId = order.villageId;
      if (!acc[villageId]) {
        acc[villageId] = {
          count: 0,
          villageName: getVillageName(villageId),
          pending: 0,
          processing: 0,
          completed: 0,
          cancelled: 0,
          orders: [],
        };
      }
      acc[villageId].count += 1;

      // 상태에 따라 해당 카운터 증가
      if (order.status === 'pending') {
        acc[villageId].pending += 1;
      } else if (order.status === 'processing') {
        acc[villageId].processing += 1;
      } else if (order.status === 'completed') {
        acc[villageId].completed += 1;
      } else if (order.status === 'cancelled') {
        acc[villageId].cancelled += 1;
      }

      // 주문 정보 추가
      acc[villageId].orders.push({
        id: order.id,
        memberName: order.memberName,
        menuItemName: getMenuItemName(order.menuItemId),
        temperature: order.temperature,
        isMild: order.isMild,
        status: order.status,
        createdAt: order.createdAt,
      });

      return acc;
    },
    {} as Record<
      number,
      {
        count: number;
        villageName: string;
        pending: number;
        processing: number;
        completed: number;
        cancelled: number;
        orders: Array<{
          id: number;
          memberName: string;
          menuItemName: string;
          isMild: boolean;
          temperature?: string;
          status: string;
          createdAt: string;
        }>;
      }
    >,
  );

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // 마을별 메뉴 집계 생성
  const generateMenuSummaryByVillage = () => {
    const menuSummary: Record<number, Record<string, number>> = {};

    // 마을별 메뉴 집계 계산
    todayOrders.forEach((order) => {
      const villageId = order.villageId;
      const menuName = getMenuItemName(order.menuItemId);

      // 온도 정보 추가
      let menuWithTemp = '';
      menuWithTemp += order.temperature === 'ice' ? '아이스 ' : '';
      menuWithTemp += order.temperature === 'hot' ? '따뜻한 ' : '';
      menuWithTemp += menuName;
      menuWithTemp += order.isMild ? ' 연하게' : '';

      if (!menuSummary[villageId]) {
        menuSummary[villageId] = {};
      }

      if (!menuSummary[villageId][menuWithTemp]) {
        menuSummary[villageId][menuWithTemp] = 0;
      }

      menuSummary[villageId][menuWithTemp]++;
    });

    // 텍스트 형식으로 변환
    let summaryText = '';

    Object.entries(villageSummary).forEach(([villageId, data]) => {
      summaryText += `[${data.villageName}마을]\n`;

      const villageMenus = menuSummary[Number(villageId)];
      if (villageMenus) {
        Object.entries(villageMenus)
          .sort(([, countA], [, countB]) => countB - countA) // 갯수 기준 내림차순 정렬
          .forEach(([menuName, count]) => {
            summaryText += `${menuName} - ${count}개\n`;
          });
      }

      summaryText += '\n';
    });

    return summaryText;
  };

  // 마을별 주문자-메뉴 목록 생성
  const generateOrderListByVillage = () => {
    let orderListText = '';

    Object.entries(villageSummary).forEach(([, data]) => {
      orderListText += `[${data.villageName}마을]\n`;

      // 주문자 이름 기준으로 정렬
      const sortedOrders = [...data.orders].sort((a, b) =>
        a.memberName.localeCompare(b.memberName, 'ko'),
      );

      sortedOrders.forEach((order) => {
        let menuWithTemp = '';
        menuWithTemp += order.temperature === 'ice' ? '아이스 ' : '';
        menuWithTemp += order.temperature === 'hot' ? '따뜻한 ' : '';
        menuWithTemp += order.menuItemName;
        menuWithTemp += order.isMild ? ' 연하게' : '';

        orderListText += `${order.memberName} - ${menuWithTemp}\n`;
      });

      orderListText += '\n';
    });

    return orderListText;
  };

  // 클립보드에 복사하는 함수
  const copyToClipboard = (text: string, successMessage: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success(successMessage, {
          position: 'top-center',
          duration: 1000,
        });
      })
      .catch((error) => {
        console.error('클립보드 복사 오류:', error);
        toast.error('클립보드 복사에 실패했습니다.', {
          position: 'top-center',
          duration: 1000,
        });
      });
  };

  return (
    <div className='space-y-6'>
      <Toaster />
      <div className='flex flex-col md:flex-row md:justify-between md:items-center gap-4'>
        <h3 className='text-lg font-medium'>주문 목록</h3>
        <div className='flex flex-col md:flex-row gap-2'>
          <Button
            onClick={() => setShowVillageSummary(!showVillageSummary)}
            variant='outline'
            className='mb-2 md:mb-0'
          >
            {showVillageSummary ? '마을별 집계 숨기기' : '오늘 마을별 집계 보기'}
          </Button>
          <Select value={filterVillageId} onValueChange={setFilterVillageId}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='마을 필터' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>모든 마을</SelectItem>
              {villages.map((village) => (
                <SelectItem key={village.id} value={village.id.toString()}>
                  {village.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='상태 필터' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>모든 상태</SelectItem>
              <SelectItem value='pending'>대기 중</SelectItem>
              <SelectItem value='processing'>처리 중</SelectItem>
              <SelectItem value='completed'>완료</SelectItem>
              <SelectItem value='cancelled'>취소됨</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {showVillageSummary && (
        <div className='mb-6'>
          <div className='flex justify-between items-center mb-3'>
            <h4 className='text-md font-medium'>오늘의 마을별 주문 현황</h4>
            <div className='flex gap-2'>
              <Button
                size='sm'
                variant='outline'
                className='flex items-center gap-1 text-xs'
                onClick={() =>
                  copyToClipboard(
                    generateMenuSummaryByVillage(),
                    '메뉴별 집계가 클립보드에 복사되었습니다.',
                  )
                }
              >
                <ClipboardCopy className='h-3.5 w-3.5' />
                메뉴별 집계 복사
              </Button>
              <Button
                size='sm'
                variant='outline'
                className='flex items-center gap-1 text-xs'
                onClick={() =>
                  copyToClipboard(
                    generateOrderListByVillage(),
                    '주문자별 목록이 클립보드에 복사되었습니다.',
                  )
                }
              >
                <ClipboardCopy className='h-3.5 w-3.5' />
                주문자별 목록 복사
              </Button>
            </div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {Object.entries(villageSummary).length > 0 ? (
              Object.entries(villageSummary).map(([villageId, data]) => (
                <div key={villageId} className='p-4 border rounded-md bg-slate-50'>
                  <div className='font-medium'>{data.villageName}마을</div>
                  <div className='text-lg font-bold mt-1'>{data.count}건</div>
                  <div className='text-sm text-muted-foreground mt-2'>
                    <div className='flex items-center gap-1'>
                      <span
                        className={`w-2 h-2 rounded-full ${getStatusColorClass('pending')}`}
                      ></span>
                      <span>대기 중: {data.pending}건</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <span
                        className={`w-2 h-2 rounded-full ${getStatusColorClass('processing')}`}
                      ></span>
                      <span>처리 중: {data.processing}건</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <span
                        className={`w-2 h-2 rounded-full ${getStatusColorClass('completed')}`}
                      ></span>
                      <span>완료: {data.completed}건</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <span
                        className={`w-2 h-2 rounded-full ${getStatusColorClass('cancelled')}`}
                      ></span>
                      <span>취소: {data.cancelled}건</span>
                    </div>
                  </div>

                  {/* 주문 상세 정보 */}
                  <div className='mt-4 pt-3 border-t'>
                    <h5 className='text-sm font-medium mb-2'>주문 상세</h5>
                    <div className='space-y-2 max-h-60 overflow-y-auto pr-1'>
                      {data.orders.map((order) => (
                        <div key={order.id} className='text-xs p-2 bg-white rounded border'>
                          <div className='flex justify-between items-start'>
                            <div>
                              <span className='font-medium'>{order.memberName}</span>
                              <div className='mt-1'>
                                {order.temperature && order.temperature === 'ice' && '아이스 '}
                                {order.temperature && order.temperature === 'hot' && '따뜻한 '}
                                {order.menuItemName}
                                {order.isMild && ' 연하게'}
                              </div>
                            </div>
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[10px] ${getStatusColorClass(
                                order.status,
                              )}`}
                            >
                              {getStatusText(order.status)}
                            </span>
                          </div>
                          <div className='text-[10px] text-muted-foreground mt-1'>
                            {formatDate(order.createdAt).split(' ')[1]} 주문
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className='col-span-full text-center py-4 text-muted-foreground'>
                오늘 들어온 주문이 없습니다.
              </div>
            )}
          </div>
        </div>
      )}

      {isLoading && <div className='text-center py-4'>로딩 중...</div>}

      <div className='space-y-4'>
        {filteredOrders.length === 0 && !isLoading ? (
          <div className='text-center py-4 text-muted-foreground'>주문 내역이 없습니다.</div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className='p-4 border rounded-md'>
              <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-4'>
                <div>
                  <div className='flex items-center gap-2'>
                    <span className='text-lg font-medium'>
                      {order.temperature && order.temperature === 'ice' && '아이스 '}
                      {order.temperature && order.temperature === 'hot' && '따뜻한 '}
                      {getMenuItemName(order.menuItemId)}
                      {order.isMild && ' 연하게'}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColorClass(order.status)}`}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    {getVillageName(order.villageId)}마을 - {order.memberName}
                    {order.isCustomName && ' (직접 입력)'}
                  </p>
                </div>
                <div className='text-sm text-muted-foreground mt-2 md:mt-0'>
                  주문 시간: {formatDate(order.createdAt)}
                </div>
              </div>
              <div className='flex flex-wrap gap-2'>
                <Button
                  onClick={() => updateOrderStatus(order.id, 'completed')}
                  size='sm'
                  variant='outline'
                  className='bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
                  disabled={isLoading}
                >
                  완료
                </Button>
                <Button
                  onClick={() => updateOrderStatus(order.id, 'cancelled')}
                  size='sm'
                  variant='outline'
                  className='bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                  disabled={isLoading}
                >
                  취소
                </Button>
                <Button
                  onClick={() => deleteOrder(order.id)}
                  size='sm'
                  variant='destructive'
                  disabled={isLoading}
                >
                  삭제
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
