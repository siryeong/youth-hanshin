import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

interface DbOrder {
  id: number;
  status: string;
  updated_at: string;
}

// 일반 사용자용 주문 상태 조회
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 주문 ID입니다.' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data: order, error } = await client
      .from('orders')
      .select('id, status, updated_at')
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
      status: typedOrder.status,
      updatedAt: new Date(typedOrder.updated_at),
    };

    return NextResponse.json(formattedOrder);
  } catch (error) {
    console.error('주문 상태 조회 오류:', error);
    return NextResponse.json(
      { error: '주문 상태 정보를 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}
