import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

interface DbMenuCategory {
  id: number;
  name: string;
}

interface DbMenuItem {
  id: number;
  name: string;
  description: string;
  category_id: number;
  image_path: string;
  is_temperature_required: boolean;
}

// 메뉴 카테고리 상세 조회 (모든 사용자 접근 가능)
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 카테고리 ID입니다.' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 카테고리 정보 조회
    const { data: category, error } = await client
      .from('menu_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!category) {
      return NextResponse.json(
        { error: '해당 ID의 카테고리를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    // 카테고리에 속한 메뉴 아이템 조회
    const { data: menuItems, error: menuItemsError } = await client
      .from('menu_items')
      .select('*')
      .eq('category_id', id);

    if (menuItemsError) {
      throw menuItemsError;
    }

    // 응답 형식 구성
    const result = {
      ...(category as unknown as DbMenuCategory),
      menuItems: menuItems as unknown as DbMenuItem[],
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('카테고리 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '카테고리 상세 정보를 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}
