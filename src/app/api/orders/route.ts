import { NextResponse } from 'next/server';
import { db } from '@/lib/db-manager';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { village, name, isCustomName, menuItemId, temperature } = body;

    // 필수 필드 검증
    if (!village || !name || !menuItemId) {
      return NextResponse.json(
        { error: '마을, 이름, 메뉴 아이템은 필수 항목입니다.' },
        { status: 400 },
      );
    }

    // 마을 목록 조회
    const villages = await db.getVillages();
    const selectedVillage = villages.find((v) => v.name === village);

    if (!selectedVillage) {
      return NextResponse.json({ error: '존재하지 않는 마을입니다.' }, { status: 400 });
    }

    // 주문 생성
    const order = await db.createOrder({
      villageId: selectedVillage.id,
      menuItemId,
      memberName: name,
      isCustomName,
      temperature,
      status: 'pending',
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: '주문이 성공적으로 등록되었습니다.',
    });
  } catch (error) {
    console.error('주문 등록 오류:', error);
    return NextResponse.json({ error: '주문을 등록하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 주문 목록 조회
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
