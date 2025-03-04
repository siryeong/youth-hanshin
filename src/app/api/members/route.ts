import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

interface DbVillageMember {
  id: number;
  name: string;
  village_id: number;
}

interface DbVillage {
  id: number;
  name: string;
}

// 마을 멤버 목록 조회
export async function GET() {
  try {
    const client = getSupabaseClient();

    // 마을 멤버 조회
    const { data: members, error } = await client
      .from('village_members')
      .select('*')
      .order('village_id', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    // 마을 정보 조회
    const { data: villages, error: villagesError } = await client
      .from('villages')
      .select('id, name');

    if (villagesError) {
      throw villagesError;
    }

    // 마을 ID를 키로 하는 맵 생성
    const villageMap = new Map<number, string>();
    (villages as unknown as DbVillage[]).forEach((village) => {
      villageMap.set(village.id, village.name);
    });

    // 응답 형식 변환
    const formattedMembers = (members as unknown as DbVillageMember[]).map((member) => ({
      id: member.id,
      name: member.name,
      villageId: member.village_id,
      villageName: villageMap.get(member.village_id) || '',
    }));

    return NextResponse.json(formattedMembers);
  } catch (error) {
    console.error('멤버 목록 조회 오류:', error);
    return NextResponse.json({ error: '멤버 목록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
