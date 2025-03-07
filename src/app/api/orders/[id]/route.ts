import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// 타입 정의
type OrderRecord = {
  id: number;
  village_id: number;
  member_name: string;
  is_custom_name: boolean;
  menu_item_id: number;
  temperature: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type VillageRecord = {
  name: string;
};

type MenuItemRecord = {
  name: string;
};

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
    const orderData = data as unknown as OrderRecord;

    // 마을 정보 조회
    const { data: villageData } = await client
      .from('villages')
      .select('name')
      .eq('id', orderData.village_id)
      .single();

    const village = villageData as unknown as VillageRecord;

    // 메뉴 아이템 정보 조회
    const { data: menuItemData } = await client
      .from('menu_items')
      .select('name')
      .eq('id', orderData.menu_item_id)
      .single();

    const menuItem = menuItemData as unknown as MenuItemRecord;

    // 응답 형식 변환
    const formattedOrder = {
      id: orderData.id,
      villageId: orderData.village_id,
      villageName: village?.name || '',
      memberName: orderData.member_name,
      isCustomName: orderData.is_custom_name,
      menuItemId: orderData.menu_item_id,
      menuItemName: menuItem?.name || '',
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

// PATCH: 주문 업데이트
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);

    // 요청 본문 파싱
    const body = await request.json();
    const { menuItemId, temperature } = body;

    // 필수 파라미터 확인
    if (!menuItemId) {
      return NextResponse.json({ error: '메뉴 아이템 ID는 필수 파라미터입니다.' }, { status: 400 });
    }

    // Supabase 클라이언트 가져오기
    const client = getSupabaseClient();

    // 주문 업데이트 데이터 준비
    const updateData: {
      menu_item_id: number;
      updated_at: string;
      temperature?: string;
    } = {
      menu_item_id: menuItemId,
      updated_at: new Date().toISOString(),
    };

    // 온도 정보가 있으면 추가
    if (temperature !== undefined) {
      updateData.temperature = temperature;
    }

    // 주문 업데이트
    const { data: orderData, error: updateError } = await client
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select(
        'id, village_id, member_name, is_custom_name, menu_item_id, temperature, status, created_at, updated_at',
      )
      .single();

    if (updateError) {
      console.error('주문 업데이트 오류:', updateError);
      return NextResponse.json({ error: '주문 업데이트 중 오류가 발생했습니다.' }, { status: 500 });
    }

    const order = orderData as OrderRecord;

    // 마을 정보 가져오기
    const { data: villageData, error: villageError } = await client
      .from('villages')
      .select('name')
      .eq('id', order.village_id)
      .single();

    if (villageError) {
      console.error('마을 정보 조회 오류:', villageError);
    }

    // 메뉴 아이템 정보 가져오기
    const { data: menuItemData, error: menuItemError } = await client
      .from('menu_items')
      .select('name')
      .eq('id', order.menu_item_id)
      .single();

    if (menuItemError) {
      console.error('메뉴 아이템 조회 오류:', menuItemError);
    }

    const villageName = villageData ? (villageData as VillageRecord).name : '알 수 없는 마을';
    const menuItemName = menuItemData ? (menuItemData as MenuItemRecord).name : '알 수 없는 메뉴';

    // 업데이트된 주문 정보 반환
    return NextResponse.json({
      id: order.id,
      villageId: order.village_id,
      villageName: villageName,
      memberName: order.member_name,
      isCustomName: order.is_custom_name,
      menuItemId: order.menu_item_id,
      menuItemName: menuItemName,
      temperature: order.temperature,
      status: order.status,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    });
  } catch (error) {
    console.error('주문 업데이트 API 오류:', error);
    return NextResponse.json({ error: '주문 업데이트 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// DELETE: 주문 삭제
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);

    // Supabase 클라이언트 가져오기
    const client = getSupabaseClient();

    // 주문 삭제
    const { error } = await client.from('orders').delete().eq('id', id);

    if (error) {
      console.error('주문 삭제 오류:', error);
      return NextResponse.json({ error: '주문 삭제 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('주문 삭제 API 오류:', error);
    return NextResponse.json({ error: '주문 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
