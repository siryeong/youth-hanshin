import { NextResponse } from 'next/server';
import { supabase, type Village } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase.from('villages').select('id, name').order('name');

    if (error) {
      throw error;
    }

    return NextResponse.json(data as Village[]);
  } catch (error) {
    console.error('마을 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '마을 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
