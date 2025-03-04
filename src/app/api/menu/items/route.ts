import { NextResponse } from 'next/server';
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

// 메뉴 아이템 목록 조회
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data: menuItems, error } = await client
      .from('menu_items')
      .select('*, category:menu_categories(name)')
      .order('category_id')
      .order('name');

    if (error) {
      throw error;
    }

    // 타입 안전하게 처리
    const typedMenuItems = menuItems as unknown as DbMenuItem[];

    // 응답 형식 변환
    const formattedMenuItems = typedMenuItems.map((item) => ({
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
