import { NextResponse } from 'next/server';
import { db } from '@/lib/db-manager';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const categoryId = category ? parseInt(category) : undefined;

    const menuItems = await db.getMenuItems(categoryId);

    // 결과를 프론트엔드에서 사용하기 쉬운 형태로 변환
    const formattedResults = menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category.name,
      image: item.imagePath,
      requiresTemperature: item.isTemperatureRequired,
    }));

    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error('메뉴 아이템 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '메뉴 아이템 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
