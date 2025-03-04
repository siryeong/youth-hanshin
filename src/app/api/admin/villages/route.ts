import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// 마을 데이터 인터페이스 정의
interface DbVillage {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  members?: Array<{ count: number }>;
}

// 포맷된 마을 데이터 인터페이스
interface FormattedVillage {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    members: number;
  };
}

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
      // 먼저 unknown으로 변환 후 타입 단언
      const villageData = village as unknown as DbVillage;

      const formattedVillage: FormattedVillage = {
        id: villageData.id,
        name: villageData.name,
        createdAt: new Date(villageData.created_at),
        updatedAt: new Date(villageData.updated_at),
        _count: {
          members:
            Array.isArray(villageData.members) && villageData.members.length > 0
              ? villageData.members[0].count
              : 0,
        },
      };

      return formattedVillage;
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
    // 먼저 unknown으로 변환 후 타입 단언
    const villageData = village as unknown as DbVillage;

    const formattedVillage: FormattedVillage = {
      id: villageData.id,
      name: villageData.name,
      createdAt: new Date(villageData.created_at),
      updatedAt: new Date(villageData.updated_at),
    };

    return NextResponse.json(formattedVillage, { status: 201 });
  } catch (error) {
    console.error('마을 생성 오류:', error);
    return NextResponse.json({ error: '마을을 생성하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
