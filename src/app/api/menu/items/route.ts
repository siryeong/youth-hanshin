import { NextResponse } from 'next/server';
import { 메뉴저장소가져오기 } from '@/repositories';

/**
 * 메뉴 아이템 목록 조회 API
 */
export async function GET(request: Request) {
  try {
    // 카테고리 ID 파라미터 추출 (선택적)
    const url = new URL(request.url);
    const categoryIdParam = url.searchParams.get('categoryId');
    const categoryId = categoryIdParam ? parseInt(categoryIdParam) : undefined;
    // 메뉴저장소를 통해 메뉴 아이템 목록 조회
    const 메뉴저장소 = 메뉴저장소가져오기();
    const 메뉴항목목록 = await 메뉴저장소.메뉴항목가져오기(categoryId);

    // 응답 형식 변환
    const 형식화된메뉴항목 = 메뉴항목목록.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      categoryId: item.categoryId,
      categoryName: item.category.name,
      imagePath: item.imagePath,
      isTemperatureRequired: item.isTemperatureRequired,
    }));

    return NextResponse.json(형식화된메뉴항목);
  } catch (error) {
    console.error('메뉴 아이템 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '메뉴 아이템 목록을 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}
