import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 관리자 전용 주문 상태 변경
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 주문 ID입니다.' }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || typeof status !== 'string') {
      return NextResponse.json({ error: '유효한 상태값이 필요합니다.' }, { status: 400 });
    }

    // 유효한 상태값 확인
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error:
            '유효하지 않은 상태값입니다. pending, processing, completed, cancelled 중 하나여야 합니다.',
        },
        { status: 400 },
      );
    }

    // 주문 존재 여부 확인
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        village: {
          select: {
            name: true,
          },
        },
        menuItem: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: '해당 ID의 주문을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 주문 상태 업데이트
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        village: {
          select: {
            name: true,
          },
        },
        menuItem: {
          select: {
            name: true,
          },
        },
      },
    });

    // 응답 형식 변환
    const formattedOrder = {
      id: updatedOrder.id,
      villageId: updatedOrder.villageId,
      villageName: updatedOrder.village.name,
      memberName: updatedOrder.memberName,
      menuItemId: updatedOrder.menuItemId,
      menuItemName: updatedOrder.menuItem.name,
      status: updatedOrder.status,
      createdAt: updatedOrder.createdAt,
      updatedAt: updatedOrder.updatedAt,
    };

    return NextResponse.json(formattedOrder);
  } catch (error) {
    console.error('주문 상태 변경 오류:', error);
    return NextResponse.json({ error: '주문 상태 변경에 실패했습니다.' }, { status: 500 });
  }
}
