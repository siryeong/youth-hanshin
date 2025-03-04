import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// 데이터베이스 모델 인터페이스 정의
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
}

interface DbVillage {
  name: string;
}

interface DbMenuItem {
  name: string;
  category_id: number;
}

interface DbCategory {
  name: string;
}

// 일반 사용자용 주문 상세 조회
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 주문 ID입니다.' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // Supabase에서 주문 정보 조회
    const { data, error } = await client.from('orders').select('*').eq('id', id).single();

    if (error || !data) {
      return NextResponse.json({ error: '해당 ID의 주문을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 타입 단언을 사용하여 안전하게 접근
    const orderData = data as unknown as DbOrder;

    // 마을 정보 조회
    const { data: villageData } = await client
      .from('villages')
      .select('name')
      .eq('id', orderData.village_id)
      .single();

    const village = villageData as unknown as DbVillage;

    // 메뉴 아이템 정보 조회
    const { data: menuItemData } = await client
      .from('menu_items')
      .select('name, category_id')
      .eq('id', orderData.menu_item_id)
      .single();

    const menuItem = menuItemData as unknown as DbMenuItem;

    // 메뉴 카테고리 정보 조회
    let categoryName = '';
    if (menuItem?.category_id) {
      const { data: categoryData } = await client
        .from('menu_categories')
        .select('name')
        .eq('id', menuItem.category_id)
        .single();

      const category = categoryData as unknown as DbCategory;
      categoryName = category?.name || '';
    }

    // 응답 형식 변환
    const formattedOrder = {
      id: orderData.id,
      villageId: orderData.village_id,
      villageName: village?.name || '',
      memberName: orderData.member_name,
      isCustomName: orderData.is_custom_name,
      menuItemId: orderData.menu_item_id,
      menuItemName: menuItem?.name || '',
      menuCategoryName: categoryName,
      temperature: orderData.temperature,
      status: orderData.status,
      createdAt: orderData.created_at,
      updatedAt: orderData.updated_at,
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
