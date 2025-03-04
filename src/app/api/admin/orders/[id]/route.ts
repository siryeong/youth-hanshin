import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// 관리자 전용 주문 상세 조회
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 주문 ID입니다.' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
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

    if (!order) {
      return NextResponse.json({ error: '해당 ID의 주문을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 응답 형식 변환
    const formattedOrder = {
      id: order.id,
      villageId: order.villageId,
      villageName: order.village.name,
      memberName: order.memberName,
      isCustomName: order.isCustomName,
      menuItemId: order.menuItemId,
      menuItemName: order.menuItem.name,
      temperature: order.temperature,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    return NextResponse.json(formattedOrder);
  } catch (error) {
    console.error('주문 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '주문 상세 정보를 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}

// 관리자 전용 주문 삭제
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 주문 ID입니다.' }, { status: 400 });
    }

    // 주문 존재 여부 확인
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: '해당 ID의 주문을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 주문 삭제
    await prisma.order.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('주문 삭제 오류:', error);
    return NextResponse.json({ error: '주문 삭제에 실패했습니다.' }, { status: 500 });
  }
}
