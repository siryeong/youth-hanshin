import { NextResponse } from 'next/server';
import { 마을주민저장소가져오기 } from '@/repositories';

// 마을 멤버 목록 조회
export async function GET() {
  try {
    // 회원저장소를 통해 회원 데이터 가져오기
    const 마을주민저장소 = 마을주민저장소가져오기();
    const 마을주민목록 = await 마을주민저장소.마을주민목록가져오기();

    return NextResponse.json(마을주민목록);
  } catch (error) {
    console.error('멤버 목록 조회 오류:', error);
    return NextResponse.json({ error: '멤버 목록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
