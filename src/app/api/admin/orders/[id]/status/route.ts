import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// 데이터베이스 모델 인터페이스 정의
interface DbOrder {
  id: number;
  village_id: number;
  member_name: string;
  menu_item_id: number;
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

// 관리자 전용 주문 상태 변경
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 주문 ID입니다.' }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || typeof status !== 'string') {
      return NextResponse.json({ error: '유효한 상태값이 필요합니다.' }, { status: 400 });
    }

    // 유효한 상태값 확인
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error:
            '유효하지 않은 상태값입니다. pending, processing, completed, cancelled 중 하나여야 합니다.',
        },
        { status: 400 },
      );
    }

    const client = getSupabaseClient();

    // 주문 존재 여부 확인
    const { error: findError } = await client.from('orders').select('id').eq('id', id).single();

    if (findError) {
      if (findError.code === 'PGRST116') {
        return NextResponse.json({ error: '해당 ID의 주문을 찾을 수 없습니다.' }, { status: 404 });
      }
      throw findError;
    }

    // 주문 상태 업데이트
    const { data: updatedOrderData, error: updateError } = await client
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select('*, village:villages(name), menuItem:menu_items(name)')
      .single();

    if (updateError) {
      throw updateError;
    }

    // 타입 안전하게 처리
    const updatedOrder = updatedOrderData as unknown as DbOrder;

    // 응답 형식 변환
    const formattedOrder = {
      id: updatedOrder.id,
      villageId: updatedOrder.village_id,
      villageName: updatedOrder.village.name,
      memberName: updatedOrder.member_name,
      menuItemId: updatedOrder.menu_item_id,
      menuItemName: updatedOrder.menuItem.name,
      status: updatedOrder.status,
      createdAt: updatedOrder.created_at,
      updatedAt: updatedOrder.updated_at,
    };

    return NextResponse.json(formattedOrder);
  } catch (error) {
    console.error('주문 상태 변경 오류:', error);
    return NextResponse.json({ error: '주문 상태 변경에 실패했습니다.' }, { status: 500 });
  }
}
