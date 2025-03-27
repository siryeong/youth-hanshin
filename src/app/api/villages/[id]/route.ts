import { NextRequest, NextResponse } from 'next/server';
import { 마을저장소가져오기 } from '@/repositories';

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

    // 마을저장소를 통해 마을 정보와 멤버 목록 가져오기
    const 마을저장소 = 마을저장소가져오기();
    try {
      // 마을 정보와 멤버 목록 각각 조회
      const 마을정보 = await 마을저장소.마을정보가져오기(id);
      const 마을멤버목록 = await 마을저장소.마을멤버가져오기(id);

      // 마을 정보와 멤버 목록 합쳐서 반환
      const result = {
        ...마을정보,
        members: 마을멤버목록,
      };

      return NextResponse.json(result);
    } catch (error) {
      // 마을을 찾을 수 없는 경우
      console.error('마을 조회 오류:', error);
      return NextResponse.json({ error: '마을을 찾을 수 없습니다.' }, { status: 404 });
    }
  } catch (error) {
    console.error('마을 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '마을 상세 정보를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
