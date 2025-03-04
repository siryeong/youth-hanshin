import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 관리자 전용 주문 목록 조회
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
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
      orderBy: [
        {
          createdAt: 'desc',
        },
      ],
    });

    // 응답 형식 변환
    const formattedOrders = orders.map((order) => ({
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
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error('주문 목록 조회 오류:', error);
    return NextResponse.json({ error: '주문 목록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
