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

interface Order {
  id: number;
  villageId: number;
  villageName?: string;
  memberName: string;
  isCustomName: boolean;
  menuItemId: number;
  menuItemName?: string;
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

  // 주문 목록 불러오기
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/orders');
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
      const response = await fetch('/api/villages');
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
      const response = await fetch('/api/menu/items');
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
      const response = await fetch(`/api/orders/${id}/status`, {
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
      const response = await fetch(`/api/orders/${id}`, {
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

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row md:justify-between md:items-center gap-4'>
        <h3 className='text-lg font-medium'>주문 목록</h3>
        <div className='flex flex-col md:flex-row gap-2'>
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
                    <span className='text-lg font-medium'>{getMenuItemName(order.menuItemId)}</span>
                    {order.temperature && (
                      <span className='text-sm text-muted-foreground'>({order.temperature})</span>
                    )}
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColorClass(order.status)}`}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    {getVillageName(order.villageId)} - {order.memberName}
                    {order.isCustomName && ' (직접 입력)'}
                  </p>
                </div>
                <div className='text-sm text-muted-foreground mt-2 md:mt-0'>
                  주문 시간: {formatDate(order.createdAt)}
                </div>
              </div>
              <div className='flex flex-wrap gap-2'>
                {order.status !== 'completed' && (
                  <Button
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                    size='sm'
                    variant='outline'
                    className='bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
                    disabled={isLoading}
                  >
                    완료 처리
                  </Button>
                )}
                {order.status === 'pending' && (
                  <Button
                    onClick={() => updateOrderStatus(order.id, 'processing')}
                    size='sm'
                    variant='outline'
                    className='bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                    disabled={isLoading}
                  >
                    처리 중으로 변경
                  </Button>
                )}
                {order.status !== 'cancelled' && order.status !== 'completed' && (
                  <Button
                    onClick={() => updateOrderStatus(order.id, 'cancelled')}
                    size='sm'
                    variant='outline'
                    className='bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                    disabled={isLoading}
                  >
                    취소 처리
                  </Button>
                )}
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
