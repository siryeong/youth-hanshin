import { NextResponse } from 'next/server';
import { OrderService } from '@/services/order.service';

/**
 * 중복 주문 확인 API
 */
export async function GET(request: Request) {
  try {
    // URL에서 쿼리 파라미터 추출
    const url = new URL(request.url);
    const villageId = url.searchParams.get('villageId');
    const memberName = url.searchParams.get('memberName');
    const dateStr = url.searchParams.get('date');

    // 필수 파라미터 확인
    if (!villageId || !memberName) {
      return NextResponse.json({ error: '마을 ID와 주문자 이름은 필수 파라미터입니다.' }, { status: 400 });
    }

    // 날짜 파라미터 처리 (기본값: 오늘)
    let date = new Date();
    if (dateStr) {
      date = new Date(dateStr);
    }

    const orderService = new OrderService();
    const villageIdNum = parseInt(villageId);

    // 중복 주문 정보 가져오기
    const duplicateOrder = await orderService.getDuplicateOrderDetails(villageIdNum, memberName, date);

    // 중복 주문이 있는 경우
    if (duplicateOrder) {
      // 응답 데이터 포매팅
      return NextResponse.json({
        hasDuplicate: true,
        order: {
          id: duplicateOrder.id,
          villageId: duplicateOrder.villageId,
          memberName: duplicateOrder.memberName,
          menuItemId: duplicateOrder.menuItemId,
          menuItemName: duplicateOrder.menuItem.name || '알 수 없는 메뉴',
          temperature: duplicateOrder.temperature,
          status: duplicateOrder.status,
          createdAt: duplicateOrder.createdAt,
        },
      });
    }

    // 중복 주문이 없는 경우
    return NextResponse.json({
      hasDuplicate: false,
    });
  } catch (error) {
    console.error('중복 주문 확인 API 오류:', error);
    return NextResponse.json({ error: '주문 확인 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
