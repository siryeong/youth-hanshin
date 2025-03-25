import { NextRequest, NextResponse } from 'next/server';
import { MenuCategoryService } from '@/services/menu-category.service';

/**
 * 관리자 전용 메뉴 카테고리 목록 조회 API
 */
export async function GET() {
  try {
    const menuCategoryService = new MenuCategoryService();

    // 카테고리 목록 조회 (메뉴 아이템 개수 포함)
    const categoriesWithCount = await menuCategoryService.getCategoriesWithItemCounts();

    return NextResponse.json(categoriesWithCount);
  } catch (error) {
    console.error('카테고리 목록 조회 오류:', error);
    return NextResponse.json({ error: '카테고리 목록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}

/**
 * 관리자 전용 메뉴 카테고리 추가 API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: '유효한 카테고리 이름을 입력해주세요.' }, { status: 400 });
    }

    const menuCategoryService = new MenuCategoryService();
    const category = await menuCategoryService.createCategory(name.trim());

    return NextResponse.json(category);
  } catch (error) {
    console.error('카테고리 추가 오류:', error);
    return NextResponse.json({ error: '카테고리 추가에 실패했습니다.' }, { status: 500 });
  }
}
