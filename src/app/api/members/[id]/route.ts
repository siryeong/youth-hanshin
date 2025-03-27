import { NextRequest, NextResponse } from 'next/server';
import { 마을주민저장소가져오기 } from '@/repositories';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// 마을 주민 상세 조회
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 주민 ID입니다.' }, { status: 400 });
    }

    // 마을주민저장소를 통해 주민 상세 정보 조회
    const 마을주민저장소 = 마을주민저장소가져오기();
    const 주민정보 = await 마을주민저장소.마을주민상세가져오기(id);

    if (!주민정보) {
      return NextResponse.json({ error: '해당 ID의 주민을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json(주민정보);
  } catch (error) {
    console.error('주민 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '주민 상세 정보를 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}
