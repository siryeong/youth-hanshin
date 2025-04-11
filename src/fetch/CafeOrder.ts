import { CafeOrder } from '@/model/model';
import { fetchApi } from './Request';

export async function createOrder(order: CafeOrder): Promise<CafeOrder> {
  const orderRequest = {
    villageId: order.village.id,
    memberId: order.member?.id,
    cafeMenuItemId: order.cafeMenuItem.id,
    customName: order.customName,
    options: order.options,
    status: order.status,
  };

  return fetchApi<CafeOrder>('/api/cafe-orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderRequest),
  });
}

export async function fetchDuplicateOrder(
  villageId?: number,
  memberId?: number,
  customName?: string,
): Promise<CafeOrder[]> {
  let uri = '/api/cafe-orders?';

  if (villageId) uri += `villageId=${villageId}&`;
  if (memberId) uri += `memberId=${memberId}&`;
  if (customName) uri += `customName=${customName}&`;

  return fetchApi<CafeOrder[]>(uri);
}

export async function fetchCafeOrders(): Promise<CafeOrder[]> {
  return fetchApi<CafeOrder[]>('/api/cafe-orders');
}

export async function updateOrder(order: CafeOrder): Promise<CafeOrder> {
  const orderRequest = {
    id: order.id,
    villageId: order.village.id,
    memberId: order.member?.id,
    cafeMenuItemId: order.cafeMenuItem.id,
    customName: order.customName,
    options: order.options,
    status: order.status,
  };

  return fetchApi<CafeOrder>(`/api/cafe-orders/${order.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderRequest),
  });
}
