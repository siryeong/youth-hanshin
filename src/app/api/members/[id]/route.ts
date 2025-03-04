import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// 데이터베이스 컬럼 이름과 일치하는 타입
interface DbVillageMember {
  id: number;
  name: string;
  village_id: number;
}

interface DbVillage {
  name: string;
}

// 마을 멤버 상세 조회
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 멤버 ID입니다.' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data: memberData, error } = await client
      .from('village_members')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!memberData) {
      return NextResponse.json({ error: '해당 ID의 멤버를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 타입 안전하게 처리
    const member = memberData as unknown as DbVillageMember;

    // 마을 정보 가져오기
    const { data: villageData, error: villageError } = await client
      .from('villages')
      .select('name')
      .eq('id', member.village_id)
      .single();

    if (villageError) {
      throw villageError;
    }

    // 타입 안전하게 처리
    const village = villageData as unknown as DbVillage;

    // 응답 형식 변환 (supabase.ts의 타입 형식에 맞춤)
    const formattedMember = {
      id: member.id,
      name: member.name,
      villageId: member.village_id,
      villageName: village.name,
    };

    return NextResponse.json(formattedMember);
  } catch (error) {
    console.error('멤버 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '멤버 상세 정보를 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}
