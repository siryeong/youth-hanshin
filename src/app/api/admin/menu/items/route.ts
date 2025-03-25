import { NextRequest, NextResponse } from 'next/server';
import { ServiceRegistry } from '@/lib/service-registry';

/**
 * 관리자 전용 메뉴 아이템 목록 조회 API
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

/**
 * 관리자 전용 메뉴 아이템 추가 API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, categoryId, imagePath, isTemperatureRequired } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: '유효한 메뉴 이름을 입력해주세요.' }, { status: 400 });
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: '유효한 메뉴 설명을 입력해주세요.' }, { status: 400 });
    }

    if (!categoryId || typeof categoryId !== 'number') {
      return NextResponse.json({ error: '유효한 카테고리 ID를 입력해주세요.' }, { status: 400 });
    }

    const menuCategoryService = ServiceRegistry.getMenuCategoryService();
    const menuItemService = ServiceRegistry.getMenuItemService();

    // 카테고리 존재 여부 확인
    const category = await menuCategoryService.getCategoryById(categoryId);

    if (!category) {
      return NextResponse.json({ error: '해당 ID의 카테고리를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 메뉴 아이템 추가
    const menuItem = await menuItemService.createMenuItem({
      name: name.trim(),
      description: description.trim(),
      categoryId,
      imagePath: imagePath || null,
      isTemperatureRequired: isTemperatureRequired || false,
    });

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
    console.error('메뉴 아이템 추가 오류:', error);
    return NextResponse.json({ error: '메뉴 아이템 추가에 실패했습니다.' }, { status: 500 });
  }
}
