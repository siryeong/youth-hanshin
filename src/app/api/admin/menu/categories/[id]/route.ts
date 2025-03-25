import { NextRequest, NextResponse } from 'next/server';
import { MenuCategoryService } from '@/services/menu-category.service';

/**
 * 관리자 전용 메뉴 카테고리 상세 조회 API
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 카테고리 ID입니다.' }, { status: 400 });
    }

    const menuCategoryService = new MenuCategoryService();
    const categoryWithItems = await menuCategoryService.getCategoryWithMenuItems(id);

    if (!categoryWithItems) {
      return NextResponse.json({ error: '해당 ID의 카테고리를 찾을 수 없습니다.' }, { status: 404 });
    }

    // Supabase 형식과 호환성을 위해 응답 형식 변환
    const response = {
      ...categoryWithItems.category,
      menuItems: categoryWithItems.menuItems,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('카테고리 상세 조회 오류:', error);
    return NextResponse.json({ error: '카테고리 상세 정보를 불러오는데 실패했습니다.' }, { status: 500 });
  }
}

/**
 * 관리자 전용 메뉴 카테고리 수정 API
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 카테고리 ID입니다.' }, { status: 400 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: '유효한 카테고리 이름을 입력해주세요.' }, { status: 400 });
    }

    const menuCategoryService = new MenuCategoryService();
    
    // 카테고리 존재 여부 확인
    const existingCategory = await menuCategoryService.getCategoryById(id);
    if (!existingCategory) {
      return NextResponse.json({ error: '해당 ID의 카테고리를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 카테고리 수정
    const updatedCategory = await menuCategoryService.updateCategory(id, name.trim());

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('카테고리 수정 오류:', error);
    return NextResponse.json({ error: '카테고리 수정에 실패했습니다.' }, { status: 500 });
  }
}

/**
 * 관리자 전용 메뉴 카테고리 삭제 API
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 카테고리 ID입니다.' }, { status: 400 });
    }

    const menuCategoryService = new MenuCategoryService();

    // 카테고리 존재 여부 확인
    const existingCategory = await menuCategoryService.getCategoryById(id);
    if (!existingCategory) {
      return NextResponse.json({ error: '해당 ID의 카테고리를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 카테고리에 속한 메뉴 아이템이 있는지 확인
    const hasMenuItems = await menuCategoryService.categoryHasMenuItems(id);
    if (hasMenuItems) {
      return NextResponse.json(
        {
          error: '이 카테고리에 속한 메뉴 아이템이 있어 삭제할 수 없습니다. 먼저 메뉴 아이템을 삭제해주세요.',
        },
        { status: 400 },
      );
    }

    // 카테고리 삭제
    await menuCategoryService.deleteCategory(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('카테고리 삭제 오류:', error);
    return NextResponse.json({ error: '카테고리 삭제에 실패했습니다.' }, { status: 500 });
  }
}
