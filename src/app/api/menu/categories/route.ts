import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 메뉴 카테고리 목록 조회
export async function GET() {
  try {
    const categories = await prisma.menuCategory.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('카테고리 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '카테고리 목록을 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}
