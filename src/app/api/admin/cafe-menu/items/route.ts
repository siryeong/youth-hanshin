import { NextRequest, NextResponse } from 'next/server';
import { findAll, create } from '@/db/repository/cafeMenuItemsRepository';

// 관리자 전용 메뉴 아이템 목록 조회
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

// 관리자 전용 메뉴 아이템 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, requiredOptions, category } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: '유효한 메뉴 이름을 입력해주세요.' }, { status: 400 });
    }

    if (!['coffee', 'tea', 'beverage'].includes(category)) {
      return NextResponse.json({ error: '유효한 카테고리를 입력해주세요.' }, { status: 400 });
    }

    const menuItem = await create({ name, price: 0, description, requiredOptions, category });
    return NextResponse.json(menuItem);
  } catch (error) {
    console.error('메뉴 아이템 추가 오류:', error);
    return NextResponse.json({ error: '메뉴 아이템 추가에 실패했습니다.' }, { status: 500 });
  }
}
