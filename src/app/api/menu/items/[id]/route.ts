import { NextRequest, NextResponse } from 'next/server';
import { 메뉴저장소가져오기 } from '@/repositories';

// 메뉴 아이템 상세 조회
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 메뉴 아이템 ID입니다.' }, { status: 400 });
    }

    const 메뉴저장소 = 메뉴저장소가져오기();

    // 메뉴 아이템 조회
    const 메뉴아이템 = await 메뉴저장소.메뉴항목상세가져오기(id);

    if (!메뉴아이템) {
      return NextResponse.json(
        { error: '해당 ID의 메뉴 아이템을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    // 카테고리 정보 조회
    const 카테고리 = await 메뉴저장소.메뉴카테고리상세가져오기(메뉴아이템.categoryId);

    if (!카테고리) {
      return NextResponse.json(
        { error: '해당 ID의 메뉴 카테고리를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    // 응답 형식 변환
    const formattedMenuItem = {
      id: 메뉴아이템.id,
      name: 메뉴아이템.name,
      description: 메뉴아이템.description,
      categoryId: 메뉴아이템.categoryId,
      categoryName: 카테고리.name,
      imagePath: 메뉴아이템.imagePath,
      isTemperatureRequired: 메뉴아이템.isTemperatureRequired,
    };

    return NextResponse.json(formattedMenuItem);
  } catch (error) {
    console.error('메뉴 아이템 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '메뉴 아이템 상세 정보를 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}
