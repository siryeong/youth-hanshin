import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// 관리자 전용 메뉴 아이템 상세 조회
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
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

    // 응답 형식 변환
    const formattedMenuItem = {
      id: menuItem.id,
      name: menuItem.name,
      description: menuItem.description,
      categoryId: menuItem.categoryId,
      categoryName: menuItem.category.name,
      imagePath: menuItem.imagePath,
      isTemperatureRequired: menuItem.isTemperatureRequired,
    };

    return NextResponse.json(formattedMenuItem);
  } catch (error) {
    console.error('메뉴 아이템 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '메뉴 아이템 상세 정보를 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}

// 관리자 전용 메뉴 아이템 수정
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 메뉴 아이템 ID입니다.' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, categoryId, imagePath, isTemperatureRequired } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: '유효한 메뉴 이름을 입력해주세요.' }, { status: 400 });
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: '유효한 메뉴 설명을 입력해주세요.' }, { status: 400 });
    }

    if (!categoryId || typeof categoryId !== 'number') {
      return NextResponse.json({ error: '유효한 카테고리 ID를 입력해주세요.' }, { status: 400 });
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
      return NextResponse.json(
        { error: '해당 ID의 카테고리를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    // 메뉴 아이템 업데이트
    const updatedMenuItem = await prisma.menuItem.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description.trim(),
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

    // 응답 형식 변환
    const formattedMenuItem = {
      id: updatedMenuItem.id,
      name: updatedMenuItem.name,
      description: updatedMenuItem.description,
      categoryId: updatedMenuItem.categoryId,
      categoryName: updatedMenuItem.category.name,
      imagePath: updatedMenuItem.imagePath,
      isTemperatureRequired: updatedMenuItem.isTemperatureRequired,
    };

    return NextResponse.json(formattedMenuItem);
  } catch (error) {
    console.error('메뉴 아이템 수정 오류:', error);
    return NextResponse.json({ error: '메뉴 아이템 수정에 실패했습니다.' }, { status: 500 });
  }
}

// 관리자 전용 메뉴 아이템 삭제
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
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
    const orders = await prisma.order.findMany({
      where: { menuItemId: id },
    });

    if (orders.length > 0) {
      return NextResponse.json(
        { error: '이 메뉴 아이템은 주문에서 사용 중이므로 삭제할 수 없습니다.' },
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
