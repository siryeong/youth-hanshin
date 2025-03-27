import { NextRequest, NextResponse } from 'next/server';
import { 주문저장소가져오기, 마을저장소가져오기, 메뉴저장소가져오기 } from '@/repositories';
import { CreateOrderData } from '@/lib/supabase';

/**
 * 일반 사용자용 주문 생성 API
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

    // 저장소 인스턴스 가져오기
    const 마을저장소 = 마을저장소가져오기();
    const 메뉴저장소 = 메뉴저장소가져오기();
    const 주문저장소 = 주문저장소가져오기();

    try {
      // 마을 존재 여부 확인
      await 마을저장소.마을정보가져오기(villageId);
    } catch (error) {
      console.error('마을 조회 오류:', error);
      return NextResponse.json({ error: '존재하지 않는 마을입니다.' }, { status: 400 });
    }

    try {
      // 메뉴 항목 존재 여부 확인
      await 메뉴저장소.메뉴항목상세가져오기(menuItemId);
    } catch (error) {
      console.error('메뉴 항목 조회 오류:', error);
      return NextResponse.json({ error: '존재하지 않는 메뉴 항목입니다.' }, { status: 400 });
    }

    // 주문 생성
    const orderData: CreateOrderData = {
      villageId,
      menuItemId,
      memberName,
      isCustomName: isCustomName || false,
      temperature: temperature || null,
      isMild: body.isMild || false,
    };

    const newOrder = await 주문저장소.주문생성하기(orderData);

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
  } catch (error) {
    console.error('주문 생성 오류:', error);
    return NextResponse.json({ error: '주문 생성에 실패했습니다.' }, { status: 500 });
  }
}

/**
 * 모든 주문 목록 가져오기 API (일반 사용자용)
 */
export async function GET() {
  try {
    // 주문저장소를 통해 주문 데이터 가져오기
    const 주문저장소 = 주문저장소가져오기();
    const 주문목록 = await 주문저장소.주문목록가져오기();

    // 민감한 정보 필터링 없이 모든 주문 정보 반환
    return NextResponse.json(
      주문목록.map((order) => ({
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
        menuItem: order.menuItem,
        village: order.village,
      })),
    );
  } catch (error) {
    console.error('주문 목록 조회 오류:', error);
    return NextResponse.json({ error: '주문 목록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
