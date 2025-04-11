import { NextRequest, NextResponse } from 'next/server';

import { findAll, findAllWithMembers } from '@/db/repository/villagesRepository';

/**
 * 모든 마을 목록 가져오기 (일반 사용자용)
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const members = searchParams.get('members') === 'true';

  try {
    if (members) {
      const villages = await findAllWithMembers();
      return NextResponse.json(villages);
    } else {
      const villages = await findAll();
      return NextResponse.json(villages);
    }
  } catch (error) {
    console.error('마을 목록 조회 오류:', error);
    return NextResponse.json({ error: '마을 목록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
