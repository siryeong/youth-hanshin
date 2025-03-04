import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// 마을 상세 조회
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 마을 ID입니다.' }, { status: 400 });
    }

    const village = await prisma.village.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!village) {
      return NextResponse.json({ error: '마을을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json(village);
  } catch (error) {
    console.error('마을 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '마을 상세 정보를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
