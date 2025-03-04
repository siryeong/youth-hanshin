import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 마을 목록 조회
export async function GET() {
  try {
    const villages = await prisma.village.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(villages);
  } catch (error) {
    console.error('마을 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '마을 목록을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
