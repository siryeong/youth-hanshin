import { NextRequest, NextResponse } from 'next/server';
import { create, findByConditions } from '@/db/repository/cafeOrdersRepository';
import { findOne as findMenuItem } from '@/db/repository/cafeMenuItemsRepository';

/**
 * 일반 사용자용 주문 생성 API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      villageId,
      memberId,
      cafeMenuItemId,
      options: { temperature, strength },
    } = body;

    // 필수 필드 검증
    if (!villageId || !memberId || cafeMenuItemId === undefined) {
      return NextResponse.json(
        { error: '마을, 멤버, 메뉴 항목은 필수 입력 사항입니다.' },
        { status: 400 },
      );
    }

    // 메뉴 항목 존재 여부 확인
    const menuItem = await findMenuItem({ id: cafeMenuItemId });
    if (!menuItem) {
      return NextResponse.json({ error: '존재하지 않는 메뉴 항목입니다.' }, { status: 400 });
    }

    // 주문 생성
    const orderData = {
      villageId,
      memberId,
      cafeMenuItemId,
      options: { temperature, strength },
      status: 'pending',
    };

    const newOrder = await create(orderData);
    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error('주문 생성 오류:', error);
    return NextResponse.json({ error: '주문 생성에 실패했습니다.' }, { status: 500 });
  }
}

/**
 * 모든 주문 목록 가져오기
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const villageId = searchParams.get('villageId');
    const customName = searchParams.get('customName');

    const orders = await findByConditions({
      villageId: villageId ? parseInt(villageId) : undefined,
      memberId: memberId ? parseInt(memberId) : undefined,
      customName: customName ? customName : undefined,
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error('주문 목록 조회 오류:', error);
    return NextResponse.json({ error: '주문 목록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
