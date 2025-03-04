import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

interface DbMenuItem {
  id: number;
  name: string;
  description: string;
  category_id: number;
  image_path: string;
  is_temperature_required: boolean;
}

// 메뉴 아이템 상세 조회
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 메뉴 아이템 ID입니다.' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 메뉴 아이템 조회
    const { data: menuItem, error } = await client
      .from('menu_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!menuItem) {
      return NextResponse.json(
        { error: '해당 ID의 메뉴 아이템을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    // 타입 안전하게 처리
    const typedMenuItem = menuItem as unknown as DbMenuItem;

    // 카테고리 정보 조회
    const { data: category, error: categoryError } = await client
      .from('menu_categories')
      .select('name')
      .eq('id', typedMenuItem.category_id)
      .single();

    if (categoryError) {
      throw categoryError;
    }

    // 타입 안전하게 처리
    const typedCategory = category as unknown as { name: string };

    // 응답 형식 변환
    const formattedMenuItem = {
      id: typedMenuItem.id,
      name: typedMenuItem.name,
      description: typedMenuItem.description,
      categoryId: typedMenuItem.category_id,
      categoryName: typedCategory.name,
      imagePath: typedMenuItem.image_path,
      isTemperatureRequired: typedMenuItem.is_temperature_required,
    };

    return NextResponse.json(formattedMenuItem);
  } catch (error) {
    console.error('메뉴 아이템 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '메뉴 아이템 상세 정보를 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}
