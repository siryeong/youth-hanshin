import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

interface DbOrder {
  id: number;
  village_id: number;
  member_name: string;
  is_custom_name: boolean;
  menu_item_id: number;
  temperature: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  village: {
    name: string;
  };
  menuItem: {
    name: string;
  };
}

// 관리자 전용 주문 상세 조회
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 주문 ID입니다.' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 주문 조회 (관계 포함)
    const { data: order, error } = await client
      .from('orders')
      .select('*, village:villages(name), menuItem:menu_items(name)')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!order) {
      return NextResponse.json({ error: '해당 ID의 주문을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 타입 안전하게 처리
    const typedOrder = order as unknown as DbOrder;

    // 응답 형식 변환
    const formattedOrder = {
      id: typedOrder.id,
      villageId: typedOrder.village_id,
      villageName: typedOrder.village.name,
      memberName: typedOrder.member_name,
      isCustomName: typedOrder.is_custom_name,
      menuItemId: typedOrder.menu_item_id,
      menuItemName: typedOrder.menuItem.name,
      temperature: typedOrder.temperature,
      status: typedOrder.status,
      createdAt: new Date(typedOrder.created_at),
      updatedAt: new Date(typedOrder.updated_at),
    };

    return NextResponse.json(formattedOrder);
  } catch (error) {
    console.error('주문 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '주문 상세 정보를 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}

// 관리자 전용 주문 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 주문 ID입니다.' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 주문 존재 여부 확인
    const { data: existingOrder, error: selectError } = await client
      .from('orders')
      .select('id')
      .eq('id', id)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116: 결과가 없음
      throw selectError;
    }

    if (!existingOrder) {
      return NextResponse.json({ error: '해당 ID의 주문을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 주문 삭제
    const { error: deleteError } = await client.from('orders').delete().eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('주문 삭제 오류:', error);
    return NextResponse.json({ error: '주문 삭제에 실패했습니다.' }, { status: 500 });
  }
}
