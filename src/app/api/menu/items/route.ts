import { NextResponse } from 'next/server';
import { ServiceRegistry } from '@/lib/service-registry';

/**
 * 메뉴 아이템 목록 조회
 */
export async function GET() {
  try {
    const menuItemService = ServiceRegistry.getMenuItemService();
    const menuItems = await menuItemService.getAllMenuItems();

    // 응답 형식 변환
    const formattedMenuItems = menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      categoryId: item.categoryId,
      categoryName: item.category.name,
      imagePath: item.imagePath,
      isTemperatureRequired: item.isTemperatureRequired,
    }));

    return NextResponse.json(formattedMenuItems);
  } catch (error) {
    console.error('메뉴 아이템 목록 조회 오류:', error);
    return NextResponse.json({ error: '메뉴 아이템 목록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
