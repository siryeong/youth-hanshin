import { NextResponse } from 'next/server';
import { ServiceRegistry } from '@/lib/service-registry';

/**
 * 메뉴 카테고리 목록 조회
 */
export async function GET() {
  try {
    const menuCategoryService = ServiceRegistry.getMenuCategoryService();
    const categories = await menuCategoryService.getAllCategories();

    return NextResponse.json(categories);
  } catch (error) {
    console.error('카테고리 목록 조회 오류:', error);
    return NextResponse.json({ error: '카테고리 목록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
