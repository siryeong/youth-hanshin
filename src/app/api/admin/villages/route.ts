import { NextRequest, NextResponse } from 'next/server';
import { findAll, create, findAllWithMembers } from '@/db/repository/villagesRepository';

// 관리자 전용 마을 목록 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.nextUrl);
  const members = searchParams.get('members') === 'true';

  try {
    if (members) {
      const villages = await findAllWithMembers();
      return NextResponse.json(villages);
    }
    const villages = await findAll();
    return NextResponse.json(villages);
  } catch (error) {
    console.error('마을 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '마을 목록을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}

// 마을 생성 (관리자 전용)
export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: '마을 이름은 필수입니다.' }, { status: 400 });
    }

    const village = await create({ name });
    if (!village) {
      return NextResponse.json(
        { error: '마을을 생성하는 중 오류가 발생했습니다.' },
        { status: 500 },
      );
    }

    return NextResponse.json(village, { status: 201 });
  } catch (error) {
    console.error('마을 생성 오류:', error);
    return NextResponse.json({ error: '마을을 생성하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
