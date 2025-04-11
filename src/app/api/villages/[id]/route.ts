import { NextRequest, NextResponse } from 'next/server';
import { findOneWithMembers } from '@/db/repository/villagesRepository';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

/**
 * 마을 상세 조회 API
 * 마을 정보와 소속 멤버 목록을 함께 반환
 */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);

    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 마을 ID입니다.' }, { status: 400 });
    }

    const village = await findOneWithMembers({ id });
    return NextResponse.json(village);
  } catch (error) {
    console.error('마을 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '마을 상세 정보를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
