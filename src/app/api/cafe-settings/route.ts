import { NextResponse } from 'next/server';
import { 카페설정저장소가져오기 } from '@/repositories';

/**
 * 카페 설정 조회 API
 */
export async function GET() {
  try {
    // 카페설정저장소를 통해 카페 설정 조회
    const 카페설정저장소 = 카페설정저장소가져오기();
    const 카페설정 = await 카페설정저장소.카페설정가져오기();

    // 설정이 없으면 기본값 반환
    if (!카페설정) {
      return NextResponse.json({
        openingTime: '10:00:00',
        closingTime: '14:00:00',
        openDays: [0], // 일요일만 영업
      });
    }

    return NextResponse.json({
      openingTime: 카페설정.openingTime,
      closingTime: 카페설정.closingTime,
      openDays: 카페설정.openDays,
    });
  } catch (error) {
    console.error('카페 설정 조회 오류:', error);
    return NextResponse.json({ error: '카페 설정을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
