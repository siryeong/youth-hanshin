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
    return NextResponse.json({ error: '마을 목록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}

// 마을 추가
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: '유효한 마을 이름을 입력해주세요.' }, { status: 400 });
    }

    const village = await prisma.village.create({
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(village);
  } catch (error) {
    console.error('마을 추가 오류:', error);
    return NextResponse.json({ error: '마을 추가에 실패했습니다.' }, { status: 500 });
  }
}
