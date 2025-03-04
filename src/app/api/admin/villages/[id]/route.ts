import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// 마을 상세 조회 (관리자 전용)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    if (villageError || !village) {
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
      { error: '마을 상세 정보를 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}

// 마을 수정 (관리자 전용)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 마을 ID입니다.' }, { status: 400 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: '유효한 마을 이름을 입력해주세요.' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 마을 수정
    const { data: village, error } = await client
      .from('villages')
      .update({ name: name.trim() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(village);
  } catch (error) {
    console.error('마을 수정 오류:', error);
    return NextResponse.json({ error: '마을 수정에 실패했습니다.' }, { status: 500 });
  }
}

// 마을 삭제 (관리자 전용)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 마을 ID입니다.' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 마을에 속한 멤버가 있는지 확인
    const { count, error: countError } = await client
      .from('village_members')
      .select('*', { count: 'exact', head: true })
      .eq('village_id', id);

    if (countError) {
      throw countError;
    }

    if (count && count > 0) {
      return NextResponse.json(
        { error: '이 마을에 속한 멤버가 있어 삭제할 수 없습니다. 먼저 멤버를 삭제해주세요.' },
        { status: 400 },
      );
    }

    // 마을 삭제
    const { error } = await client.from('villages').delete().eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('마을 삭제 오류:', error);
    return NextResponse.json({ error: '마을 삭제에 실패했습니다.' }, { status: 500 });
  }
}
