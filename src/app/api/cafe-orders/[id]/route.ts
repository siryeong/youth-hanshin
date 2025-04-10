import { NextResponse } from 'next/server';
import { findOne, update } from '@/db/repository/cafeOrdersRepository';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // URL에서 쿼리 파라미터 추출
    const { id: idString } = await params;
    const id = parseInt(idString);

    // 필수 파라미터 확인
    if (!id) {
      return NextResponse.json({ error: '주문 ID는 필수 파라미터입니다.' }, { status: 400 });
    }

    // 주문 조회
    const 주문 = await findOne({ id });
    return NextResponse.json(주문);
  } catch (error) {
    console.error('주문 조회 오류:', error);
    return NextResponse.json({ error: '주문 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);

    if (!id) {
      return NextResponse.json({ error: '주문 ID는 필수 파라미터입니다.' }, { status: 400 });
    }

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

    // 주문 생성
    const orderData = {
      id,
      villageId,
      memberId,
      cafeMenuItemId,
      options: { temperature, strength },
    };

    const updatedOrder = await update(orderData);
    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('주문 업데이트 오류:', error);
    return NextResponse.json({ error: '주문 업데이트 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
