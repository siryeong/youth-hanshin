import { NextResponse } from 'next/server';
import { 마을주민저장소가져오기 } from '@/repositories';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const villageId = searchParams.get('villageId');

    if (!villageId) {
      return NextResponse.json({ error: '마을 ID가 필요합니다.' }, { status: 400 });
    }

    // 마을주민저장소를 통해 마을 주민 목록 조회
    const 마을주민저장소 = 마을주민저장소가져오기();
    const 마을주민목록 = await 마을주민저장소.마을별주민목록가져오기(parseInt(villageId));

    return NextResponse.json(마을주민목록);
  } catch (error) {
    console.error('마을 주민 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '마을 주민 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
