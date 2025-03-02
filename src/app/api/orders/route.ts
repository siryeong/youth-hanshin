import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { village, name, isCustomName, menuItemId, temperature } = body;

    // 필수 필드 검증
    if (!village || !name || !menuItemId) {
      return NextResponse.json(
        { error: '마을, 이름, 메뉴 아이템은 필수 항목입니다.' },
        { status: 400 },
      );
    }

    // 마을 ID 조회
    const { data: villageData, error: villageError } = await supabase
      .from('villages')
      .select('id')
      .eq('name', village)
      .single();

    if (villageError || !villageData) {
      return NextResponse.json({ error: '존재하지 않는 마을입니다.' }, { status: 400 });
    }

    const villageId = villageData.id;

    // 주문 정보 저장
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        village_id: villageId,
        member_name: name,
        is_custom_name: isCustomName,
        menu_item_id: menuItemId,
        temperature: temperature || null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (orderError) {
      throw orderError;
    }

    return NextResponse.json({
      success: true,
      orderId: orderData.id,
      message: '주문이 성공적으로 등록되었습니다.',
    });
  } catch (error) {
    console.error('주문 등록 오류:', error);
    return NextResponse.json({ error: '주문을 등록하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        id,
        member_name,
        is_custom_name,
        temperature,
        status,
        created_at,
        villages(name),
        menu_items(name)
      `,
      )
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // 결과를 프론트엔드에서 사용하기 쉬운 형태로 변환
    const formattedResults = data.map((item) => {
      // Supabase 외래 키 관계 처리
      const villageName =
        item.villages && Array.isArray(item.villages) && item.villages.length > 0
          ? item.villages[0].name
          : '';

      const menuItemName =
        item.menu_items && Array.isArray(item.menu_items) && item.menu_items.length > 0
          ? item.menu_items[0].name
          : '';

      return {
        id: item.id,
        member_name: item.member_name,
        is_custom_name: item.is_custom_name,
        temperature: item.temperature,
        status: item.status,
        created_at: item.created_at,
        village: villageName,
        menu_item: menuItemName,
      };
    });

    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error('주문 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '주문 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
