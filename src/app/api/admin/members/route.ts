import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

interface DbVillageMember {
  id: number;
  name: string;
  village_id: number;
}

// 관리자 전용 멤버 목록 조회
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
    (villages as unknown as { id: number; name: string }[]).forEach((village) => {
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

// 관리자 전용 멤버 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, villageId } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: '유효한 멤버 이름을 입력해주세요.' }, { status: 400 });
    }

    if (!villageId || typeof villageId !== 'number') {
      return NextResponse.json({ error: '유효한 마을 ID를 입력해주세요.' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 마을 존재 여부 확인
    const { data: village, error: villageError } = await client
      .from('villages')
      .select('id')
      .eq('id', villageId)
      .single();

    if (villageError && villageError.code !== 'PGRST116') {
      // PGRST116: 결과가 없음
      throw villageError;
    }

    if (!village) {
      return NextResponse.json({ error: '해당 ID의 마을을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 멤버 추가
    const { data: newMember, error: createError } = await client
      .from('village_members')
      .insert({ name: name.trim(), village_id: villageId })
      .select('*')
      .single();

    if (createError) {
      throw createError;
    }

    // 타입 안전하게 처리
    const member = newMember as unknown as DbVillageMember;

    // 마을 이름 조회
    const { data: memberVillage, error: memberVillageError } = await client
      .from('villages')
      .select('name')
      .eq('id', member.village_id)
      .single();

    if (memberVillageError) {
      throw memberVillageError;
    }

    // 응답 형식 변환
    const formattedMember = {
      id: member.id,
      name: member.name,
      villageId: member.village_id,
      villageName: (memberVillage as unknown as { name: string }).name,
    };

    return NextResponse.json(formattedMember);
  } catch (error) {
    console.error('멤버 추가 오류:', error);
    return NextResponse.json({ error: '멤버 추가에 실패했습니다.' }, { status: 500 });
  }
}
