import { NextRequest, NextResponse } from 'next/server';
import { 메뉴저장소가져오기 } from '@/repositories';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// 메뉴 카테고리 상세 조회 (모든 사용자 접근 가능)
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 카테고리 ID입니다.' }, { status: 400 });
    }

    // 메뉴저장소를 통해 카테고리 상세 정보 조회
    const 메뉴저장소 = 메뉴저장소가져오기();
    const 카테고리 = await 메뉴저장소.메뉴카테고리상세가져오기(id);

    if (!카테고리) {
      return NextResponse.json(
        { error: '해당 ID의 카테고리를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    // 카테고리에 속한 메뉴 아이템 조회
    const 메뉴항목목록 = await 메뉴저장소.메뉴항목가져오기(id);

    // 응답 형식 구성
    const result = {
      ...카테고리,
      menuItems: 메뉴항목목록,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('카테고리 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '카테고리 상세 정보를 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}
