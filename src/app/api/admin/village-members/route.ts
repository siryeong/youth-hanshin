import { NextRequest, NextResponse } from 'next/server';
import { findAllWithMembers } from '@/db/repository/villagesRepository';

// 관리자 전용 멤버 목록 조회
export async function GET() {
  try {
    const villages = await findAllWithMembers();
    return NextResponse.json(villages);
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

    // TODO: 멤버 추가 로직 구현
  } catch (error) {
    console.error('멤버 추가 오류:', error);
    return NextResponse.json({ error: '멤버 추가에 실패했습니다.' }, { status: 500 });
  }
}
