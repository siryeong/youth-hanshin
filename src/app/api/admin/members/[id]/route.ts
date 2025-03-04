import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// 관리자 전용 멤버 상세 조회
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

// 관리자 전용 멤버 수정
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 멤버 ID입니다.' }, { status: 400 });
    }

    const body = await request.json();
    const { name, villageId } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: '유효한 멤버 이름을 입력해주세요.' }, { status: 400 });
    }

    if (!villageId || typeof villageId !== 'number') {
      return NextResponse.json({ error: '유효한 마을 ID를 입력해주세요.' }, { status: 400 });
    }

    // 멤버 존재 여부 확인
    const existingMember = await prisma.villageMember.findUnique({
      where: { id },
    });

    if (!existingMember) {
      return NextResponse.json({ error: '해당 ID의 멤버를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 마을 존재 여부 확인
    const village = await prisma.village.findUnique({
      where: { id: villageId },
    });

    if (!village) {
      return NextResponse.json({ error: '해당 ID의 마을을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 멤버 업데이트
    const updatedMember = await prisma.villageMember.update({
      where: { id },
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
      id: updatedMember.id,
      name: updatedMember.name,
      villageId: updatedMember.villageId,
      villageName: updatedMember.village.name,
    };

    return NextResponse.json(formattedMember);
  } catch (error) {
    console.error('멤버 수정 오류:', error);
    return NextResponse.json({ error: '멤버 수정에 실패했습니다.' }, { status: 500 });
  }
}

// 관리자 전용 멤버 삭제
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 멤버 ID입니다.' }, { status: 400 });
    }

    // 멤버 존재 여부 확인
    const existingMember = await prisma.villageMember.findUnique({
      where: { id },
    });

    if (!existingMember) {
      return NextResponse.json({ error: '해당 ID의 멤버를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 멤버 삭제
    await prisma.villageMember.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('멤버 삭제 오류:', error);
    return NextResponse.json({ error: '멤버 삭제에 실패했습니다.' }, { status: 500 });
  }
}
