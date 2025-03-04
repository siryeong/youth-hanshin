import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// 메뉴 카테고리 상세 조회 (모든 사용자 접근 가능)
export async function GET(request: NextRequest, { params }: Params) {
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
