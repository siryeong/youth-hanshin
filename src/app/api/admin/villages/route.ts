import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 관리자 전용 마을 목록 조회
export async function GET() {
  try {
    const villages = await prisma.village.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
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

// 마을 생성 (관리자 전용)
export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: '마을 이름은 필수입니다.' }, { status: 400 });
    }

    const village = await prisma.village.create({
      data: {
        name,
      },
    });

    return NextResponse.json(village, { status: 201 });
  } catch (error) {
    console.error('마을 생성 오류:', error);
    return NextResponse.json({ error: '마을을 생성하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
