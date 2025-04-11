import { findOneWithMembers, update, remove } from '@/db/repository/villagesRepository';
import { NextRequest, NextResponse } from 'next/server';

// 마을 상세 조회 (관리자 전용)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 마을 ID입니다.' }, { status: 400 });
    }
    const result = await findOneWithMembers({ id });
    return NextResponse.json(result);
  } catch (error) {
    console.error('마을 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '마을 상세 정보를 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}

// 마을 수정 (관리자 전용)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 마을 ID입니다.' }, { status: 400 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: '유효한 마을 이름을 입력해주세요.' }, { status: 400 });
    }

    // 마을 수정
    const result = await update({ id, name });
    return NextResponse.json(result);
  } catch (error) {
    console.error('마을 수정 오류:', error);
    return NextResponse.json({ error: '마을 수정에 실패했습니다.' }, { status: 500 });
  }
}

// 마을 삭제 (관리자 전용)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 마을 ID입니다.' }, { status: 400 });
    }

    await remove({ id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('마을 삭제 오류:', error);
    return NextResponse.json({ error: '마을 삭제에 실패했습니다.' }, { status: 500 });
  }
}
