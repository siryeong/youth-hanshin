import { update, remove } from '@/db/repository/membersRepository';
import { NextRequest, NextResponse } from 'next/server';

// 관리자 전용 멤버 수정
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, phone, birthDate } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: '유효한 멤버 이름을 입력해주세요.' }, { status: 400 });
    }

    const member = await update({ id: parseInt(id), name, phone, birthDate });
    return NextResponse.json(member);
  } catch (error) {
    console.error('멤버 수정 오류:', error);
    return NextResponse.json({ error: '멤버 수정에 실패했습니다.' }, { status: 500 });
  }
}

// 관리자 전용 멤버 삭제
export async function DELETE({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await remove({ id: parseInt(id) });
    return NextResponse.json({ message: '멤버가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('멤버 삭제 오류:', error);
    return NextResponse.json({ error: '멤버 삭제에 실패했습니다.' }, { status: 500 });
  }
}
