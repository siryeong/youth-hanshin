import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/services/order.service';

/**
 * 일반 사용자용 주문 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { villageId, memberName, isCustomName, menuItemId, temperature } = body;

    // 필수 필드 검증
    if (!villageId || !memberName || menuItemId === undefined) {
      return NextResponse.json(
        { error: '마을, 이름, 메뉴 항목은 필수 입력 사항입니다.' },
        { status: 400 },
      );
    }

    const orderService = new OrderService();

    // 주문 생성
    const orderData = {
      villageId,
      menuItemId,
      memberName,
      isCustomName: isCustomName || false,
      temperature: temperature || null,
      isMild: body.isMild || false,
    };

    try {
      const newOrder = await orderService.createOrder(orderData);

      // 응답 형식 변환
      const formattedOrder = {
        id: newOrder.id,
        villageId: newOrder.villageId,
        villageName: newOrder.village.name,
        memberName: newOrder.memberName,
        isCustomName: newOrder.isCustomName,
        menuItemId: newOrder.menuItemId,
        menuItemName: newOrder.menuItem.name,
        temperature: newOrder.temperature,
        isMild: newOrder.isMild,
        status: newOrder.status,
        createdAt: newOrder.createdAt,
        updatedAt: newOrder.updatedAt,
      };

      return NextResponse.json(formattedOrder, { status: 201 });
    } catch (serviceError) {
      // Service layer에서 발생한 특정 에러 처리
      if (serviceError instanceof Error) {
        if (serviceError.message.includes('Village')) {
          return NextResponse.json({ error: '존재하지 않는 마을입니다.' }, { status: 400 });
        } else if (serviceError.message.includes('Menu item')) {
          return NextResponse.json({ error: '존재하지 않는 메뉴 항목입니다.' }, { status: 400 });
        }
      }
      // 기타 에러는 일반 에러로 처리
      throw serviceError;
    }
  } catch (error) {
    console.error('주문 생성 오류:', error);
    return NextResponse.json({ error: '주문 생성에 실패했습니다.' }, { status: 500 });
  }
}

/**
 * 모든 주문 목록 가져오기 (일반 사용자용)
 */
export async function GET() {
  try {
    const orderService = new OrderService();

    // 주문 데이터 가져오기
    const orders = await orderService.getAllOrders();

    // 모든 주문 정보 반환
    return NextResponse.json(orders);
  } catch (error) {
    console.error('주문 목록 조회 오류:', error);
    return NextResponse.json({ error: '주문 목록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
