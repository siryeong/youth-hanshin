import { NextRequest, NextResponse } from 'next/server';
import { findAll, create } from '@/db/repository/membersRepository';

// 관리자 전용 멤버 목록 조회
export async function GET() {
  try {
    const members = await findAll();
    return NextResponse.json(members);
  } catch (error) {
    console.error('멤버 목록 조회 오류:', error);
    return NextResponse.json({ error: '멤버 목록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}

// 관리자 전용 멤버 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, birthDate, extra } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: '유효한 멤버 이름을 입력해주세요.' }, { status: 400 });
    }

    const member = await create({ name, phone, birthDate, extra });
    return NextResponse.json(member);
  } catch (error) {
    console.error('멤버 추가 오류:', error);
    return NextResponse.json({ error: '멤버 추가에 실패했습니다.' }, { status: 500 });
  }
}
