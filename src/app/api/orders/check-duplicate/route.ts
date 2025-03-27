import { NextResponse } from 'next/server';
import { 주문저장소가져오기 } from '@/repositories';

export async function GET(request: Request) {
  try {
    // URL에서 쿼리 파라미터 추출
    const url = new URL(request.url);
    const villageId = url.searchParams.get('villageId');
    const memberName = url.searchParams.get('memberName');
    const dateStr = url.searchParams.get('date');

    // 필수 파라미터 확인
    if (!villageId || !memberName) {
      return NextResponse.json(
        { error: '마을 ID와 주문자 이름은 필수 파라미터입니다.' },
        { status: 400 },
      );
    }

    // 날짜 파라미터 처리
    let date: Date | undefined;
    if (dateStr) {
      date = new Date(dateStr);
    }

    // 주문저장소를 통해 중복 주문 확인
    const 주문저장소 = 주문저장소가져오기();
    const 중복확인결과 = await 주문저장소.중복주문확인하기(parseInt(villageId), memberName, date);

    return NextResponse.json(중복확인결과);
  } catch (error) {
    console.error('중복 주문 확인 API 오류:', error);
    return NextResponse.json({ error: '주문 확인 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
