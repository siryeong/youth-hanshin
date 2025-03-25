import { NextResponse } from 'next/server';
import { ServiceRegistry } from '@/lib/service-registry';

/**
 * 관리자 전용 주문 목록 조회 API
 */
export async function GET() {
  try {
    const orderService = ServiceRegistry.getOrderService();

    // 주문 목록 조회 (관계 포함)
    const orders = await orderService.getAllOrders();

    // 응답 형식 변환
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      villageId: order.villageId,
      villageName: order.village.name,
      memberName: order.memberName,
      isCustomName: order.isCustomName,
      menuItemId: order.menuItemId,
      menuItemName: order.menuItem.name,
      isMild: order.isMild,
      temperature: order.temperature,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error('주문 목록 조회 오류:', error);
    return NextResponse.json({ error: '주문 목록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
