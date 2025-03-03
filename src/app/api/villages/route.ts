import { NextResponse } from 'next/server';
import { db } from '@/lib/db-manager';

export async function GET() {
  try {
    const villages = await db.getVillages();
    return NextResponse.json(villages);
  } catch (error) {
    console.error('마을 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '마을 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
