import { NextResponse } from 'next/server';
import { findAll } from '@/db/repository/cafeMenuItemsRepository';

/**
 * 메뉴 아이템 목록 조회 API
 */
export async function GET() {
  try {
    const menuItems = await findAll();
    return NextResponse.json(menuItems);
  } catch (error) {
    console.error('메뉴 아이템 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '메뉴 아이템 목록을 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}
