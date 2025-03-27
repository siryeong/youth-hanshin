import { NextRequest, NextResponse } from 'next/server';
import { 주문저장소가져오기 } from '@/repositories';

// 일반 사용자용 주문 상태 조회
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 주문 ID입니다.' }, { status: 400 });
    }

    const 주문저장소 = 주문저장소가져오기();
    const 주문 = await 주문저장소.주문상세가져오기(id);

    if (!주문) {
      return NextResponse.json({ error: '해당 ID의 주문을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 응답 형식 변환
    const formattedOrder = {
      id: 주문.id,
      status: 주문.status,
      updatedAt: new Date(주문.updatedAt),
    };

    return NextResponse.json(formattedOrder);
  } catch (error) {
    console.error('주문 상태 조회 오류:', error);
    return NextResponse.json(
      { error: '주문 상태 정보를 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}
