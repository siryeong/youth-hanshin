import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// 데이터베이스 모델 인터페이스 정의
interface DbMenuItem {
  id: number;
  name: string;
  description: string;
  category_id: number;
  image_path: string;
  is_temperature_required: boolean;
  category: {
    name: string;
  };
}

// 관리자 전용 메뉴 아이템 목록 조회
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data: menuItemsData, error } = await client
      .from('menu_items')
      .select('*, category:menu_categories(name)')
      .order('category_id')
      .order('name');

    if (error) {
      throw error;
    }

    // 타입 안전하게 처리
    const menuItems = menuItemsData as unknown as DbMenuItem[];

    // 응답 형식 변환
    const formattedMenuItems = menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      categoryId: item.category_id,
      categoryName: item.category.name,
      imagePath: item.image_path,
      isTemperatureRequired: item.is_temperature_required,
    }));

    return NextResponse.json(formattedMenuItems);
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

    const client = getSupabaseClient();

    // 카테고리 존재 여부 확인
    const { error: categoryError } = await client
      .from('menu_categories')
      .select('id')
      .eq('id', categoryId)
      .single();

    if (categoryError) {
      return NextResponse.json(
        { error: '해당 ID의 카테고리를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    // Supabase 형식으로 변환
    const menuItemData = {
      name: name.trim(),
      description: description.trim(),
      category_id: categoryId,
      image_path: imagePath || '',
      is_temperature_required: isTemperatureRequired || false,
    };

    // 메뉴 아이템 추가
    const { data: createdMenuItem, error: createError } = await client
      .from('menu_items')
      .insert(menuItemData)
      .select('*, category:menu_categories(name)')
      .single();

    if (createError) {
      throw createError;
    }

    // 타입 안전하게 처리
    const menuItem = createdMenuItem as unknown as DbMenuItem;

    // 응답 형식 변환
    const formattedMenuItem = {
      id: menuItem.id,
      name: menuItem.name,
      description: menuItem.description,
      categoryId: menuItem.category_id,
      categoryName: menuItem.category.name,
      imagePath: menuItem.image_path,
      isTemperatureRequired: menuItem.is_temperature_required,
    };

    return NextResponse.json(formattedMenuItem);
  } catch (error) {
    console.error('메뉴 아이템 추가 오류:', error);
    return NextResponse.json({ error: '메뉴 아이템 추가에 실패했습니다.' }, { status: 500 });
  }
}
