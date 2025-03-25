import { NextRequest, NextResponse } from 'next/server';
import { ServiceRegistry } from '@/lib/service-registry';

/**
 * 관리자 전용 주문 상세 조회 API
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 주문 ID입니다.' }, { status: 400 });
    }

    const orderService = ServiceRegistry.getOrderService();

    // 주문 조회 (관계 포함)
    const order = await orderService.getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: '해당 ID의 주문을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 응답 형식 변환
    const formattedOrder = {
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
    };

    return NextResponse.json(formattedOrder);
  } catch (error) {
    console.error('주문 상세 조회 오류:', error);
    return NextResponse.json({ error: '주문 상세 정보를 불러오는데 실패했습니다.' }, { status: 500 });
  }
}

/**
 * 관리자 전용 주문 삭제 API
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 주문 ID입니다.' }, { status: 400 });
    }

    const orderService = ServiceRegistry.getOrderService();

    // 주문 존재 여부 확인
    const existingOrder = await orderService.getOrderById(id);

    if (!existingOrder) {
      return NextResponse.json({ error: '해당 ID의 주문을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 주문 삭제
    await orderService.deleteOrder(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('주문 삭제 오류:', error);
    return NextResponse.json({ error: '주문 삭제에 실패했습니다.' }, { status: 500 });
  }
}
