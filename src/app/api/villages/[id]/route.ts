import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// 마을 상세 조회
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);

    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 마을 ID입니다.' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 마을 정보 조회
    const { data: village, error: villageError } = await client
      .from('villages')
      .select('*')
      .eq('id', id)
      .single();

    if (villageError) {
      return NextResponse.json({ error: '마을을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 마을 멤버 조회
    const { data: members, error: membersError } = await client
      .from('village_members')
      .select('*')
      .eq('village_id', id);

    if (membersError) {
      console.error('마을 멤버 조회 오류:', membersError);
    }

    // 결과 조합
    const result = {
      ...village,
      members: members || [],
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('마을 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '마을 상세 정보를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
