import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// 메뉴 카테고리 목록 조회
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data: categories, error } = await client
      .from('menu_categories')
      .select('*')
      .order('name');

    if (error) {
      throw error;
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.error('카테고리 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '카테고리 목록을 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}
