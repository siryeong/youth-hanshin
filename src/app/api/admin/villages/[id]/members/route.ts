import { NextRequest, NextResponse } from 'next/server';
import { updateVillageMembers } from '@/db/repository/villagesRepository';

// 마을 멤버 일괄 업데이트 API
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 마을 ID입니다.' }, { status: 400 });
    }

    const body = await request.json();
    const { memberIds } = body;

    if (!Array.isArray(memberIds)) {
      return NextResponse.json({ error: '멤버 ID 목록이 필요합니다.' }, { status: 400 });
    }

    // 마을 멤버 일괄 업데이트
    const result = await updateVillageMembers({ villageId: id, memberIds });
    return NextResponse.json(result);
  } catch (error) {
    console.error('마을 멤버 업데이트 오류:', error);
    return NextResponse.json(
      { error: '마을 멤버를 업데이트하는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
