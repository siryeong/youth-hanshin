import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 관리자 전용 멤버 상세 조회
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 멤버 ID입니다.' }, { status: 400 });
    }

    const body = await request.json();
    const { name, villageId } = body;

    // 필수 필드 검증
    if (!name || !villageId) {
      return NextResponse.json(
        { error: '이름과 마을 ID는 필수 입력 사항입니다.' },
        { status: 400 },
      );
    }

    // 마을 존재 여부 확인
    const village = await prisma.village.findUnique({
      where: { id: villageId },
    });

    if (!village) {
      return NextResponse.json({ error: '존재하지 않는 마을입니다.' }, { status: 400 });
    }

    // 멤버 존재 여부 확인
    const existingMember = await prisma.villageMember.findUnique({
      where: { id },
    });

    if (!existingMember) {
      return NextResponse.json({ error: '해당 ID의 멤버를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 멤버 수정
    const updatedMember = await prisma.villageMember.update({
      where: { id },
      data: {
        name,
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
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
