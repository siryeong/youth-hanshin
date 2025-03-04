import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// 관리자 전용 메뉴 카테고리 목록 조회
export async function GET() {
  try {
    const client = getSupabaseClient();

    // 카테고리 목록 조회
    const { data: categories, error } = await client
      .from('menu_categories')
      .select('*')
      .order('name');

    if (error) {
      throw error;
    }

    // 각 카테고리별 메뉴 아이템 개수 조회
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        // 타입 단언을 사용하여 안전하게 처리
        const categoryId = category.id as number;
        const { count, error: countError } = await client
          .from('menu_items')
          .select('*', { count: 'exact' })
          .eq('category_id', categoryId)
          .limit(0);

        if (countError) {
          throw countError;
        }

        return {
          ...category,
          _count: {
            menuItems: count || 0,
          },
        };
      }),
    );

    return NextResponse.json(categoriesWithCount);
  } catch (error) {
    console.error('카테고리 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '카테고리 목록을 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}

// 관리자 전용 메뉴 카테고리 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: '유효한 카테고리 이름을 입력해주세요.' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data: category, error } = await client
      .from('menu_categories')
      .insert({ name: name.trim() })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('카테고리 추가 오류:', error);
    return NextResponse.json({ error: '카테고리 추가에 실패했습니다.' }, { status: 500 });
  }
}
