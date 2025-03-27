import { NextResponse } from 'next/server';
import { 마을저장소가져오기 } from '@/repositories';

/**
 * 모든 마을 목록 가져오기 (일반 사용자용)
 */
export async function GET() {
  try {
    // 마을저장소를 통해 마을 데이터 가져오기
    const 마을저장소 = 마을저장소가져오기();
    const 마을목록 = await 마을저장소.모든마을가져오기();

    // 모든 마을 정보 반환
    return NextResponse.json(마을목록);
  } catch (error) {
    console.error('마을 목록 조회 오류:', error);
    return NextResponse.json({ error: '마을 목록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
