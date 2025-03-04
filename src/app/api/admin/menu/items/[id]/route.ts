import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 관리자 전용 메뉴 아이템 상세 조회
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 메뉴 아이템 ID입니다.' }, { status: 400 });
    }

    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!menuItem) {
      return NextResponse.json(
        { error: '해당 ID의 메뉴 아이템을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    return NextResponse.json(menuItem);
  } catch (error) {
    console.error('메뉴 아이템 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '메뉴 아이템 상세 정보를 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}

// 관리자 전용 메뉴 아이템 수정
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 메뉴 아이템 ID입니다.' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, categoryId, imagePath, isTemperatureRequired } = body;

    // 필수 필드 검증
    if (!name || !description || !categoryId) {
      return NextResponse.json(
        { error: '이름, 설명, 카테고리 ID는 필수 입력 사항입니다.' },
        { status: 400 },
      );
    }

    // 메뉴 아이템 존재 여부 확인
    const existingMenuItem = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!existingMenuItem) {
      return NextResponse.json(
        { error: '해당 ID의 메뉴 아이템을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    // 카테고리 존재 여부 확인
    const category = await prisma.menuCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json({ error: '존재하지 않는 카테고리입니다.' }, { status: 400 });
    }

    // 메뉴 아이템 수정
    const updatedMenuItem = await prisma.menuItem.update({
      where: { id },
      data: {
        name,
        description,
        categoryId,
        imagePath: imagePath || '',
        isTemperatureRequired: isTemperatureRequired || false,
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedMenuItem);
  } catch (error) {
    console.error('메뉴 아이템 수정 오류:', error);
    return NextResponse.json({ error: '메뉴 아이템 수정에 실패했습니다.' }, { status: 500 });
  }
}

// 관리자 전용 메뉴 아이템 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 메뉴 아이템 ID입니다.' }, { status: 400 });
    }

    // 메뉴 아이템 존재 여부 확인
    const existingMenuItem = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!existingMenuItem) {
      return NextResponse.json(
        { error: '해당 ID의 메뉴 아이템을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    // 주문에서 사용 중인지 확인
    const orderCount = await prisma.order.count({
      where: { menuItemId: id },
    });

    if (orderCount > 0) {
      return NextResponse.json(
        {
          error: '이 메뉴 아이템은 주문에서 사용 중이므로 삭제할 수 없습니다.',
        },
        { status: 400 },
      );
    }

    // 메뉴 아이템 삭제
    await prisma.menuItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('메뉴 아이템 삭제 오류:', error);
    return NextResponse.json({ error: '메뉴 아이템 삭제에 실패했습니다.' }, { status: 500 });
  }
}
