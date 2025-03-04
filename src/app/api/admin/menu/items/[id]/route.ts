import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// 관리자 전용 메뉴 아이템 상세 조회
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 메뉴 아이템 ID입니다.' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data: menuItem, error } = await client
      .from('menu_items')
      .select('*, category:menu_categories(name)')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: '해당 ID의 메뉴 아이템을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    return NextResponse.json(menuItem);
  } catch (error) {
    console.error('메뉴 아이템 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '메뉴 아이템 상세 정보를 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}

// 관리자 전용 메뉴 아이템 수정
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 메뉴 아이템 ID입니다.' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, categoryId, imagePath, isTemperatureRequired } = body;

    // 필수 필드 검증
    if (!name || !description || !categoryId) {
      return NextResponse.json(
        { error: '이름, 설명, 카테고리 ID는 필수 입력 사항입니다.' },
        { status: 400 },
      );
    }

    const client = getSupabaseClient();

    // 메뉴 아이템 존재 여부 확인
    const { error: findError } = await client.from('menu_items').select('id').eq('id', id).single();

    if (findError) {
      return NextResponse.json(
        { error: '해당 ID의 메뉴 아이템을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    // 카테고리 존재 여부 확인
    const { error: categoryError } = await client
      .from('menu_categories')
      .select('id')
      .eq('id', categoryId)
      .single();

    if (categoryError) {
      return NextResponse.json({ error: '존재하지 않는 카테고리입니다.' }, { status: 400 });
    }

    // Supabase 형식으로 변환
    const updateData = {
      name,
      description,
      category_id: categoryId,
      image_path: imagePath || '',
      is_temperature_required: isTemperatureRequired || false,
    };

    // 메뉴 아이템 수정
    const { data: updatedMenuItem, error: updateError } = await client
      .from('menu_items')
      .update(updateData)
      .eq('id', id)
      .select('*, category:menu_categories(name)')
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(updatedMenuItem);
  } catch (error) {
    console.error('메뉴 아이템 수정 오류:', error);
    return NextResponse.json({ error: '메뉴 아이템 수정에 실패했습니다.' }, { status: 500 });
  }
}

// 관리자 전용 메뉴 아이템 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 메뉴 아이템 ID입니다.' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 메뉴 아이템 존재 여부 확인
    const { error: findError } = await client.from('menu_items').select('id').eq('id', id).single();

    if (findError) {
      return NextResponse.json(
        { error: '해당 ID의 메뉴 아이템을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    // 주문에서 사용 중인지 확인
    const { count: orderCount, error: countError } = await client
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('menu_item_id', id);

    if (countError) {
      throw countError;
    }

    if (orderCount && orderCount > 0) {
      return NextResponse.json(
        {
          error: '이 메뉴 아이템은 주문에서 사용 중이므로 삭제할 수 없습니다.',
        },
        { status: 400 },
      );
    }

    // 메뉴 아이템 삭제
    const { error: deleteError } = await client.from('menu_items').delete().eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('메뉴 아이템 삭제 오류:', error);
    return NextResponse.json({ error: '메뉴 아이템 삭제에 실패했습니다.' }, { status: 500 });
  }
}
