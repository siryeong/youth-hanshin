import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 마을 멤버 목록 조회
export async function GET() {
  try {
    const members = await prisma.villageMember.findMany({
      include: {
        village: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        {
          villageId: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });

    // 응답 형식 변환
    const formattedMembers = members.map((member) => ({
      id: member.id,
      name: member.name,
      villageId: member.villageId,
      villageName: member.village.name,
    }));

    return NextResponse.json(formattedMembers);
  } catch (error) {
    console.error('멤버 목록 조회 오류:', error);
    return NextResponse.json({ error: '멤버 목록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
