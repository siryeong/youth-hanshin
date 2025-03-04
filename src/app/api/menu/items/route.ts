import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 메뉴 아이템 목록 조회
export async function GET() {
  try {
    const menuItems = await prisma.menuItem.findMany({
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        {
          categoryId: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });

    // 응답 형식 변환
    const formattedMenuItems = menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      categoryId: item.categoryId,
      categoryName: item.category.name,
      imagePath: item.imagePath,
      isTemperatureRequired: item.isTemperatureRequired,
    }));

    return NextResponse.json(formattedMenuItems);
  } catch (error) {
    console.error('메뉴 아이템 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '메뉴 아이템 목록을 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}

// 메뉴 아이템 추가
export async function POST(request: Request) {
  try {
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

    // 메뉴 아이템 추가
    const menuItem = await prisma.menuItem.create({
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
    console.error('메뉴 아이템 추가 오류:', error);
    return NextResponse.json({ error: '메뉴 아이템 추가에 실패했습니다.' }, { status: 500 });
  }
}
