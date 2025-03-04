import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// 마을 멤버 상세 조회
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 멤버 ID입니다.' }, { status: 400 });
    }

    const member = await prisma.villageMember.findUnique({
      where: { id },
      include: {
        village: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: '해당 ID의 멤버를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 응답 형식 변환
    const formattedMember = {
      id: member.id,
      name: member.name,
      villageId: member.villageId,
      villageName: member.village.name,
    };

    return NextResponse.json(formattedMember);
  } catch (error) {
    console.error('멤버 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '멤버 상세 정보를 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}
