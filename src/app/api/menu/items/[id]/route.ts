import { NextRequest, NextResponse } from 'next/server';
import { ServiceRegistry } from '@/lib/service-registry';

/**
 * 메뉴 아이템 상세 조회
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 메뉴 아이템 ID입니다.' }, { status: 400 });
    }

    const menuItemService = ServiceRegistry.getMenuItemService();

    // 메뉴 아이템 조회
    const menuItem = await menuItemService.getMenuItemById(id);

    if (!menuItem) {
      return NextResponse.json({ error: '해당 ID의 메뉴 아이템을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 응답 형식 변환
    const formattedMenuItem = {
      id: menuItem.id,
      name: menuItem.name,
      description: menuItem.description,
      categoryId: menuItem.categoryId,
      categoryName: menuItem.category.name,
      imagePath: menuItem.imagePath,
      isTemperatureRequired: menuItem.isTemperatureRequired,
    };

    return NextResponse.json(formattedMenuItem);
  } catch (error) {
    console.error('메뉴 아이템 상세 조회 오류:', error);
    return NextResponse.json({ error: '메뉴 아이템 상세 정보를 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
