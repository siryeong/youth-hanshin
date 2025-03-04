import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 마을 상세 조회 (관리자 전용)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
      { error: '마을 상세 정보를 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}

// 마을 수정 (관리자 전용)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 마을 ID입니다.' }, { status: 400 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: '유효한 마을 이름을 입력해주세요.' }, { status: 400 });
    }

    const village = await prisma.village.update({
      where: { id },
      data: { name: name.trim() },
    });

    return NextResponse.json(village);
  } catch (error) {
    console.error('마을 수정 오류:', error);
    return NextResponse.json({ error: '마을 수정에 실패했습니다.' }, { status: 500 });
  }
}

// 마을 삭제 (관리자 전용)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 마을 ID입니다.' }, { status: 400 });
    }

    // 마을에 속한 멤버가 있는지 확인
    const membersCount = await prisma.villageMember.count({
      where: { villageId: id },
    });

    if (membersCount > 0) {
      return NextResponse.json(
        { error: '이 마을에 속한 멤버가 있어 삭제할 수 없습니다. 먼저 멤버를 삭제해주세요.' },
        { status: 400 },
      );
    }

    await prisma.village.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('마을 삭제 오류:', error);
    return NextResponse.json({ error: '마을 삭제에 실패했습니다.' }, { status: 500 });
  }
}
