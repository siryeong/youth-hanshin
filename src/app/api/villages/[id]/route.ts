import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// 마을 수정
export async function PUT(request: Request, { params }: Params) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 마을 ID입니다.' }, { status: 400 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: '유효한 마을 이름을 입력해주세요.' }, { status: 400 });
    }

    // 마을 존재 여부 확인
    const existingVillage = await prisma.village.findUnique({
      where: { id },
    });

    if (!existingVillage) {
      return NextResponse.json({ error: '해당 ID의 마을을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 마을 업데이트
    const updatedVillage = await prisma.village.update({
      where: { id },
      data: { name: name.trim() },
    });

    return NextResponse.json(updatedVillage);
  } catch (error) {
    console.error('마을 수정 오류:', error);
    return NextResponse.json({ error: '마을 수정에 실패했습니다.' }, { status: 500 });
  }
}

// 마을 삭제
export async function DELETE(request: Request, { params }: Params) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 마을 ID입니다.' }, { status: 400 });
    }

    // 마을 존재 여부 확인
    const existingVillage = await prisma.village.findUnique({
      where: { id },
    });

    if (!existingVillage) {
      return NextResponse.json({ error: '해당 ID의 마을을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 마을에 속한 멤버가 있는지 확인
    const villageMembers = await prisma.villageMember.findMany({
      where: { villageId: id },
    });

    if (villageMembers.length > 0) {
      return NextResponse.json(
        { error: '이 마을에 속한 멤버가 있어 삭제할 수 없습니다. 먼저 멤버를 삭제해주세요.' },
        { status: 400 },
      );
    }

    // 마을과 관련된 주문이 있는지 확인
    const orders = await prisma.order.findMany({
      where: { villageId: id },
    });

    if (orders.length > 0) {
      return NextResponse.json(
        { error: '이 마을과 관련된 주문이 있어 삭제할 수 없습니다. 먼저 주문을 삭제해주세요.' },
        { status: 400 },
      );
    }

    // 마을 삭제
    await prisma.village.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('마을 삭제 오류:', error);
    return NextResponse.json({ error: '마을 삭제에 실패했습니다.' }, { status: 500 });
  }
}
