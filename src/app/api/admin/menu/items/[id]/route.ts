import { NextRequest, NextResponse } from 'next/server';
import { MenuItemService } from '@/services/menu-item.service';
import { MenuCategoryService } from '@/services/menu-category.service';

/**
 * 관리자 전용 메뉴 아이템 상세 조회 API
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 메뉴 아이템 ID입니다.' }, { status: 400 });
    }

    const menuItemService = new MenuItemService();
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

/**
 * 관리자 전용 메뉴 아이템 수정 API
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 메뉴 아이템 ID입니다.' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, categoryId, imagePath, isTemperatureRequired } = body;

    // 필수 필드 검증
    if (!name || !description || !categoryId) {
      return NextResponse.json({ error: '이름, 설명, 카테고리 ID는 필수 입력 사항입니다.' }, { status: 400 });
    }

    const menuItemService = new MenuItemService();
    const menuCategoryService = new MenuCategoryService();

    // 메뉴 아이템 존재 여부 확인
    const existingMenuItem = await menuItemService.getMenuItemById(id);

    if (!existingMenuItem) {
      return NextResponse.json({ error: '해당 ID의 메뉴 아이템을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 카테고리 존재 여부 확인
    const category = await menuCategoryService.getCategoryById(categoryId);

    if (!category) {
      return NextResponse.json({ error: '존재하지 않는 카테고리입니다.' }, { status: 400 });
    }

    // 메뉴 아이템 수정
    const updatedMenuItem = await menuItemService.updateMenuItem(id, {
      name,
      description,
      categoryId,
      imagePath: imagePath || null,
      isTemperatureRequired: isTemperatureRequired || false,
    });

    // 응답 형식 변환
    const formattedMenuItem = {
      id: updatedMenuItem.id,
      name: updatedMenuItem.name,
      description: updatedMenuItem.description,
      categoryId: updatedMenuItem.categoryId,
      categoryName: updatedMenuItem.category.name,
      imagePath: updatedMenuItem.imagePath,
      isTemperatureRequired: updatedMenuItem.isTemperatureRequired,
    };

    return NextResponse.json(formattedMenuItem);
  } catch (error) {
    console.error('메뉴 아이템 수정 오류:', error);
    return NextResponse.json({ error: '메뉴 아이템 수정에 실패했습니다.' }, { status: 500 });
  }
}

/**
 * 관리자 전용 메뉴 아이템 삭제 API
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 메뉴 아이템 ID입니다.' }, { status: 400 });
    }

    const menuItemService = new MenuItemService();

    // 메뉴 아이템 존재 여부 확인
    const existingMenuItem = await menuItemService.getMenuItemById(id);

    if (!existingMenuItem) {
      return NextResponse.json({ error: '해당 ID의 메뉴 아이템을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 주문에서 사용 중인지 확인
    const isUsedInOrders = await menuItemService.isMenuItemUsedInOrders(id);

    if (isUsedInOrders) {
      return NextResponse.json(
        {
          error: '이 메뉴 아이템은 주문에서 사용 중이므로 삭제할 수 없습니다.',
        },
        { status: 400 },
      );
    }

    // 메뉴 아이템 삭제
    await menuItemService.deleteMenuItem(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('메뉴 아이템 삭제 오류:', error);
    return NextResponse.json({ error: '메뉴 아이템 삭제에 실패했습니다.' }, { status: 500 });
  }
}
