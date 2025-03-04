import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // 마을 존재 여부 확인
    const village = await prisma.village.findUnique({
      where: { id: villageId },
    });

    if (!village) {
      return NextResponse.json({ error: '존재하지 않는 마을입니다.' }, { status: 400 });
    }

    // 메뉴 항목 존재 여부 확인
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
    });

    if (!menuItem) {
      return NextResponse.json({ error: '존재하지 않는 메뉴 항목입니다.' }, { status: 400 });
    }

    // 주문 생성
    const newOrder = await prisma.order.create({
      data: {
        villageId,
        memberName,
        isCustomName: isCustomName || false,
        menuItemId,
        temperature: temperature || null,
        status: 'pending',
      },
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
      id: newOrder.id,
      villageId: newOrder.villageId,
      villageName: newOrder.village.name,
      memberName: newOrder.memberName,
      isCustomName: newOrder.isCustomName,
      menuItemId: newOrder.menuItemId,
      menuItemName: newOrder.menuItem.name,
      temperature: newOrder.temperature,
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
