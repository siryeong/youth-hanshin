import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 관리자 전용 메뉴 카테고리 상세 조회
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 카테고리 ID입니다.' }, { status: 400 });
    }

    const category = await prisma.menuCategory.findUnique({
      where: { id },
      include: {
        menuItems: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: '해당 ID의 카테고리를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('카테고리 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '카테고리 상세 정보를 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}

// 관리자 전용 메뉴 카테고리 수정
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 카테고리 ID입니다.' }, { status: 400 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: '유효한 카테고리 이름을 입력해주세요.' }, { status: 400 });
    }

    // 카테고리 존재 여부 확인
    const existingCategory = await prisma.menuCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: '해당 ID의 카테고리를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    // 카테고리 수정
    const updatedCategory = await prisma.menuCategory.update({
      where: { id },
      data: { name: name.trim() },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('카테고리 수정 오류:', error);
    return NextResponse.json({ error: '카테고리 수정에 실패했습니다.' }, { status: 500 });
  }
}

// 관리자 전용 메뉴 카테고리 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 카테고리 ID입니다.' }, { status: 400 });
    }

    // 카테고리 존재 여부 확인
    const existingCategory = await prisma.menuCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: '해당 ID의 카테고리를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    // 카테고리에 속한 메뉴 아이템이 있는지 확인
    const menuItemCount = await prisma.menuItem.count({
      where: { categoryId: id },
    });

    if (menuItemCount > 0) {
      return NextResponse.json(
        {
          error:
            '이 카테고리에 속한 메뉴 아이템이 있어 삭제할 수 없습니다. 먼저 메뉴 아이템을 삭제해주세요.',
        },
        { status: 400 },
      );
    }

    // 카테고리 삭제
    await prisma.menuCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('카테고리 삭제 오류:', error);
    return NextResponse.json({ error: '카테고리 삭제에 실패했습니다.' }, { status: 500 });
  }
}
