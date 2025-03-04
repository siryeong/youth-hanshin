import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 관리자 전용 멤버 목록 조회
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

// 관리자 전용 멤버 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, villageId } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: '유효한 멤버 이름을 입력해주세요.' }, { status: 400 });
    }

    if (!villageId || typeof villageId !== 'number') {
      return NextResponse.json({ error: '유효한 마을 ID를 입력해주세요.' }, { status: 400 });
    }

    // 마을 존재 여부 확인
    const village = await prisma.village.findUnique({
      where: { id: villageId },
    });

    if (!village) {
      return NextResponse.json({ error: '해당 ID의 마을을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 멤버 추가
    const member = await prisma.villageMember.create({
      data: {
        name: name.trim(),
        villageId,
      },
      include: {
        village: {
          select: {
            name: true,
          },
        },
      },
    });

    // 응답 형식 변환
    const formattedMember = {
      id: member.id,
      name: member.name,
      villageId: member.villageId,
      villageName: member.village.name,
    };

    return NextResponse.json(formattedMember);
  } catch (error) {
    console.error('멤버 추가 오류:', error);
    return NextResponse.json({ error: '멤버 추가에 실패했습니다.' }, { status: 500 });
  }
}
