import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

interface DbVillageMember {
  id: number;
  name: string;
  village_id: number;
}

// 관리자 전용 멤버 상세 조회
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 멤버 ID입니다.' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 멤버 정보 조회
    const { data: member, error } = await client
      .from('village_members')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!member) {
      return NextResponse.json({ error: '해당 ID의 멤버를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 타입 안전하게 처리
    const typedMember = member as unknown as DbVillageMember;

    // 마을 정보 조회
    const { data: village, error: villageError } = await client
      .from('villages')
      .select('name')
      .eq('id', typedMember.village_id)
      .single();

    if (villageError) {
      throw villageError;
    }

    // 타입 안전하게 처리
    const typedVillage = village as unknown as { name: string };

    // 응답 형식 변환
    const formattedMember = {
      id: typedMember.id,
      name: typedMember.name,
      villageId: typedMember.village_id,
      villageName: typedVillage.name,
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

// 관리자 전용 멤버 수정
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 멤버 ID입니다.' }, { status: 400 });
    }

    const body = await request.json();
    const { name, villageId } = body;

    // 필수 필드 검증
    if (!name || !villageId) {
      return NextResponse.json(
        { error: '이름과 마을 ID는 필수 입력 사항입니다.' },
        { status: 400 },
      );
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
      return NextResponse.json({ error: '존재하지 않는 마을입니다.' }, { status: 400 });
    }

    // 멤버 존재 여부 확인
    const { data: existingMember, error: memberError } = await client
      .from('village_members')
      .select('id')
      .eq('id', id)
      .single();

    if (memberError && memberError.code !== 'PGRST116') {
      throw memberError;
    }

    if (!existingMember) {
      return NextResponse.json({ error: '해당 ID의 멤버를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 멤버 수정
    const { data: updatedMember, error: updateError } = await client
      .from('village_members')
      .update({ name, village_id: villageId })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      throw updateError;
    }

    // 타입 안전하게 처리
    const typedMember = updatedMember as unknown as DbVillageMember;

    // 업데이트된 마을 정보 조회
    const { data: updatedVillage, error: updatedVillageError } = await client
      .from('villages')
      .select('name')
      .eq('id', typedMember.village_id)
      .single();

    if (updatedVillageError) {
      throw updatedVillageError;
    }

    // 타입 안전하게 처리
    const typedVillage = updatedVillage as unknown as { name: string };

    // 응답 형식 변환
    const formattedMember = {
      id: typedMember.id,
      name: typedMember.name,
      villageId: typedMember.village_id,
      villageName: typedVillage.name,
    };

    return NextResponse.json(formattedMember);
  } catch (error) {
    console.error('멤버 수정 오류:', error);
    return NextResponse.json({ error: '멤버 수정에 실패했습니다.' }, { status: 500 });
  }
}

// 관리자 전용 멤버 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 멤버 ID입니다.' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 멤버 존재 여부 확인
    const { data: existingMember, error: memberError } = await client
      .from('village_members')
      .select('id')
      .eq('id', id)
      .single();

    if (memberError && memberError.code !== 'PGRST116') {
      throw memberError;
    }

    if (!existingMember) {
      return NextResponse.json({ error: '해당 ID의 멤버를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 멤버 삭제
    const { error: deleteError } = await client.from('village_members').delete().eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('멤버 삭제 오류:', error);
    return NextResponse.json({ error: '멤버 삭제에 실패했습니다.' }, { status: 500 });
  }
}
