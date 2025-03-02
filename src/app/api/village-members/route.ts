import { NextResponse } from 'next/server';
import { supabase, type VillageMember } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const villageId = searchParams.get('villageId');

    if (!villageId) {
      return NextResponse.json({ error: '마을 ID가 필요합니다.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('village_members')
      .select('id, name')
      .eq('village_id', villageId)
      .order('name');

    if (error) {
      throw error;
    }

    return NextResponse.json(data as VillageMember[]);
  } catch (error) {
    console.error('마을 주민 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '마을 주민 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
