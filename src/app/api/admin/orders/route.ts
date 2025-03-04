import { NextResponse } from 'next/server';
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

// 관리자 전용 주문 목록 조회
export async function GET() {
  try {
    const client = getSupabaseClient();

    // 주문 목록 조회 (관계 포함)
    const { data: orders, error } = await client
      .from('orders')
      .select('*, village:villages(name), menuItem:menu_items(name)')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // 타입 안전하게 처리
    const typedOrders = orders as unknown as DbOrder[];

    // 응답 형식 변환
    const formattedOrders = typedOrders.map((order) => ({
      id: order.id,
      villageId: order.village_id,
      villageName: order.village.name,
      memberName: order.member_name,
      isCustomName: order.is_custom_name,
      menuItemId: order.menu_item_id,
      menuItemName: order.menuItem.name,
      temperature: order.temperature,
      status: order.status,
      createdAt: new Date(order.created_at),
      updatedAt: new Date(order.updated_at),
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error('주문 목록 조회 오류:', error);
    return NextResponse.json({ error: '주문 목록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
