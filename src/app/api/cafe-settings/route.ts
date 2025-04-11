import { NextResponse } from 'next/server';
import { findOne } from '@/db/repository/cafeSettingsRepository';

/**
 * 카페 설정 조회 API
 */
export async function GET() {
  try {
    const cafeSettings = await findOne();
    return NextResponse.json(cafeSettings);
  } catch (error) {
    console.error('카페 설정 조회 오류:', error);
    return NextResponse.json({ error: '카페 설정을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
