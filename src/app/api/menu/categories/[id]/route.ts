import { NextRequest, NextResponse } from 'next/server';
import { MenuCategoryService } from '@/services/menu-category.service';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

/**
 * 메뉴 카테고리 상세 조회 (모든 사용자 접근 가능)
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 카테고리 ID입니다.' }, { status: 400 });
    }

    const menuCategoryService = new MenuCategoryService();
    const result = await menuCategoryService.getCategoryWithMenuItems(id);

    if (!result) {
      return NextResponse.json({ error: '해당 ID의 카테고리를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 응답 형식 구성
    const response = {
      id: result.category.id,
      name: result.category.name,
      menuItems: result.menuItems.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category_id: item.categoryId, // Mapping from categoryId to category_id for API compatibility
        image_path: item.imagePath, // Mapping from imagePath to image_path for API compatibility
        is_temperature_required: item.isTemperatureRequired, // Mapping for API compatibility
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('카테고리 상세 조회 오류:', error);
    return NextResponse.json({ error: '카테고리 상세 정보를 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
