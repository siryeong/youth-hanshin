import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 일반 사용자용 주문 상태 조회
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 주문 ID입니다.' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: '해당 ID의 주문을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('주문 상태 조회 오류:', error);
    return NextResponse.json(
      { error: '주문 상태 정보를 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}
