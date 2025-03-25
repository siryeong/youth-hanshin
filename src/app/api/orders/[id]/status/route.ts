import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/services/order.service';

/**
 * 일반 사용자용 주문 상태 조회
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 주문 ID입니다.' }, { status: 400 });
    }

    const orderService = new OrderService();
    const order = await orderService.getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: '해당 ID의 주문을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 응답 형식 변환 - 상태 정보만 반환
    const formattedOrder = {
      id: order.id,
      status: order.status,
      updatedAt: order.updatedAt,
    };

    return NextResponse.json(formattedOrder);
  } catch (error) {
    console.error('주문 상태 조회 오류:', error);
    return NextResponse.json({ error: '주문 상태 정보를 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
