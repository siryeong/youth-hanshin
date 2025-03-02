import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let query = supabase
      .from('menu_items')
      .select(
        `
        id, 
        name, 
        description, 
        image_path,
        is_temperature_required,
        menu_categories(name)
      `,
      )
      .order('name');

    if (category) {
      query = query.eq('menu_categories.name', category);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // 결과를 프론트엔드에서 사용하기 쉬운 형태로 변환
    const formattedResults = data.map((item) => {
      // Supabase 외래 키 관계 처리
      const categoryName =
        item.menu_categories &&
        Array.isArray(item.menu_categories) &&
        item.menu_categories.length > 0
          ? item.menu_categories[0].name
          : '';

      return {
        id: item.id,
        name: item.name,
        description: item.description,
        category: categoryName,
        image: item.image_path,
        requiresTemperature: item.is_temperature_required,
      };
    });

    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error('메뉴 아이템 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '메뉴 아이템 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
