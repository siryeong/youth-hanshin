import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// 관리자 전용 마을 목록 조회
export async function GET() {
  try {
    const client = getSupabaseClient();

    // 마을 목록 조회
    const { data: villages, error } = await client
      .from('villages')
      .select('*, members:village_members(count)')
      .order('name');

    if (error) throw error;

    // 결과 형식 변환
    const formattedVillages = villages.map((village) => {
      const villageData = village as any; // 타입 단언
      return {
        id: villageData.id,
        name: villageData.name,
        createdAt: new Date(villageData.created_at as string),
        updatedAt: new Date(villageData.updated_at as string),
        _count: {
          members:
            Array.isArray(villageData.members) && villageData.members.length > 0
              ? villageData.members[0].count
              : 0,
        },
      };
    });

    return NextResponse.json(formattedVillages);
  } catch (error) {
    console.error('마을 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '마을 목록을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}

// 마을 생성 (관리자 전용)
export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: '마을 이름은 필수입니다.' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 마을 생성
    const { data: village, error } = await client
      .from('villages')
      .insert({ name })
      .select()
      .single();

    if (error) throw error;

    // 결과 형식 변환
    const villageData = village as any; // 타입 단언
    const formattedVillage = {
      id: villageData.id,
      name: villageData.name,
      createdAt: new Date(villageData.created_at as string),
      updatedAt: new Date(villageData.updated_at as string),
    };

    return NextResponse.json(formattedVillage, { status: 201 });
  } catch (error) {
    console.error('마을 생성 오류:', error);
    return NextResponse.json({ error: '마을을 생성하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
