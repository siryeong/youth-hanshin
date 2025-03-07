import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// 타입 정의
type OrderRecord = {
  id: number;
  village_id: number;
  member_name: string;
  menu_item_id: number;
  temperature: string | null;
  status: string;
  created_at: string;
};

type MenuItemRecord = {
  name: string;
};

export async function GET(request: Request) {
  try {
    // URL에서 쿼리 파라미터 추출
    const url = new URL(request.url);
    const villageId = url.searchParams.get('villageId');
    const memberName = url.searchParams.get('memberName');
    const dateStr = url.searchParams.get('date');

    // 필수 파라미터 확인
    if (!villageId || !memberName) {
      return NextResponse.json(
        { error: '마을 ID와 주문자 이름은 필수 파라미터입니다.' },
        { status: 400 },
      );
    }

    // 날짜 파라미터 처리 (기본값: 오늘)
    let date = new Date();
    if (dateStr) {
      date = new Date(dateStr);
    }

    // 날짜 범위 설정 (해당 날짜의 00:00:00부터 23:59:59까지)
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Supabase 클라이언트 가져오기
    const client = getSupabaseClient();

    // 중복 주문 확인 쿼리
    const { data, error } = await client
      .from('orders')
      .select('id, village_id, member_name, menu_item_id, temperature, status, created_at')
      .eq('village_id', parseInt(villageId))
      .eq('member_name', memberName)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('중복 주문 확인 오류:', error);
      return NextResponse.json({ error: '주문 확인 중 오류가 발생했습니다.' }, { status: 500 });
    }

    // 중복 주문이 있는 경우
    if (data && data.length > 0) {
      const order = data[0] as OrderRecord;

      // 메뉴 아이템 정보 가져오기
      const { data: menuItemData, error: menuItemError } = await client
        .from('menu_items')
        .select('name')
        .eq('id', order.menu_item_id)
        .single();

      if (menuItemError) {
        console.error('메뉴 아이템 조회 오류:', menuItemError);
      }

      const menuItemName = menuItemData ? (menuItemData as MenuItemRecord).name : '알 수 없는 메뉴';

      // 응답 데이터 포맷팅
      return NextResponse.json({
        hasDuplicate: true,
        order: {
          id: order.id,
          villageId: order.village_id,
          memberName: order.member_name,
          menuItemId: order.menu_item_id,
          menuItemName: menuItemName,
          temperature: order.temperature,
          status: order.status,
          createdAt: order.created_at,
        },
      });
    }

    // 중복 주문이 없는 경우
    return NextResponse.json({
      hasDuplicate: false,
    });
  } catch (error) {
    console.error('중복 주문 확인 API 오류:', error);
    return NextResponse.json({ error: '주문 확인 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
