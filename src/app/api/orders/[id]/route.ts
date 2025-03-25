import { NextRequest, NextResponse } from 'next/server';
import { ServiceRegistry } from '@/lib/service-registry';

/**
 * 일반 사용자용 주문 상세 조회
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 주문 ID입니다.' }, { status: 400 });
    }

    const orderService = ServiceRegistry.getOrderService();

    // 주문 정보 조회
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
      temperature: order.temperature,
      isMild: order.isMild,
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
 * 주문 업데이트
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);

    // 요청 본문 파싱
    const body = await request.json();
    const { menuItemId, temperature, isMild } = body;

    // 필수 파라미터 확인
    if (!menuItemId) {
      return NextResponse.json({ error: '메뉴 아이템 ID는 필수 파라미터입니다.' }, { status: 400 });
    }

    const orderService = ServiceRegistry.getOrderService();

    // 주문 업데이트 데이터 준비
    const updateData = {
      menuItemId,
      temperature: temperature !== undefined ? temperature : undefined,
      isMild: isMild !== undefined ? isMild : undefined,
    };

    try {
      // 주문 업데이트
      const updatedOrder = await orderService.updateOrder(id, updateData);

      // 업데이트된 주문 정보 반환
      return NextResponse.json({
        id: updatedOrder.id,
        villageId: updatedOrder.villageId,
        villageName: updatedOrder.village.name,
        memberName: updatedOrder.memberName,
        isCustomName: updatedOrder.isCustomName,
        menuItemId: updatedOrder.menuItemId,
        menuItemName: updatedOrder.menuItem.name,
        temperature: updatedOrder.temperature,
        isMild: updatedOrder.isMild,
        status: updatedOrder.status,
        createdAt: updatedOrder.createdAt,
        updatedAt: updatedOrder.updatedAt,
      });
    } catch (serviceError) {
      if (serviceError instanceof Error) {
        if (serviceError.message.includes('not found')) {
          return NextResponse.json({ error: '해당 ID의 주문을 찾을 수 없습니다.' }, { status: 404 });
        }
      }
      throw serviceError;
    }
  } catch (error) {
    console.error('주문 업데이트 API 오류:', error);
    return NextResponse.json({ error: '주문 업데이트 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

/**
 * 주문 삭제
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);

    const orderService = ServiceRegistry.getOrderService();

    try {
      // 주문 삭제
      await orderService.deleteOrder(id);
      return NextResponse.json({ message: '주문이 삭제되었습니다.' });
    } catch (serviceError) {
      if (serviceError instanceof Error) {
        if (serviceError.message.includes('not found')) {
          return NextResponse.json({ error: '해당 ID의 주문을 찾을 수 없습니다.' }, { status: 404 });
        }
      }
      throw serviceError;
    }
  } catch (error) {
    console.error('주문 삭제 API 오류:', error);
    return NextResponse.json({ error: '주문 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
