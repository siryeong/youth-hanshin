import { NextResponse } from 'next/server';
import { 메뉴저장소가져오기 } from '@/repositories';

/**
 * 메뉴 카테고리 목록 조회 API
 */
export async function GET() {
  try {
    // 메뉴저장소를 통해 카테고리 목록 조회
    const 메뉴저장소 = 메뉴저장소가져오기();
    const 카테고리목록 = await 메뉴저장소.메뉴카테고리가져오기();

    return NextResponse.json(카테고리목록);
  } catch (error) {
    console.error('카테고리 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '카테고리 목록을 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}
