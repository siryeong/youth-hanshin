import { NextRequest, NextResponse } from 'next/server';
import { supabase, getSupabaseClient } from '@/lib/supabase';

// 일반 사용자용 주문 생성
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

    // Supabase 클라이언트 가져오기
    const client = getSupabaseClient();

    // 마을 존재 여부 확인
    const { data: village, error: villageError } = await client
      .from('villages')
      .select('*')
      .eq('id', villageId)
      .single();

    if (villageError || !village) {
      return NextResponse.json({ error: '존재하지 않는 마을입니다.' }, { status: 400 });
    }

    // 메뉴 항목 존재 여부 확인
    const { data: menuItem, error: menuItemError } = await client
      .from('menu_items')
      .select('*')
      .eq('id', menuItemId)
      .single();

    if (menuItemError || !menuItem) {
      return NextResponse.json({ error: '존재하지 않는 메뉴 항목입니다.' }, { status: 400 });
    }

    // 주문 생성
    const orderData = {
      villageId,
      menuItemId,
      memberName,
      isCustomName: isCustomName || false,
      temperature: temperature || null,
      isMild: body.isMild || false,
    };

    const newOrder = await supabase.createOrder(orderData);

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

// 모든 주문 목록 가져오기 (일반 사용자용)
export async function GET() {
  try {
    // 주문 데이터 가져오기
    const orders = await supabase.getOrders();

    // 민감한 정보 필터링 없이 모든 주문 정보 반환
    return NextResponse.json(orders);
  } catch (error) {
    console.error('주문 목록 조회 오류:', error);
    return NextResponse.json({ error: '주문 목록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
