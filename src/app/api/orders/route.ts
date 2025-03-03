import { NextResponse } from 'next/server';
import { db } from '@/lib/db-manager';

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

    // 마을 목록 조회
    const villages = await db.getVillages();
    const selectedVillage = villages.find((v) => v.name === village);

    if (!selectedVillage) {
      return NextResponse.json({ error: '존재하지 않는 마을입니다.' }, { status: 400 });
    }

    // 주문 생성
    const order = await db.createOrder({
      villageId: selectedVillage.id,
      menuItemId,
      memberName: name,
      isCustomName,
      temperature,
      status: 'pending',
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: '주문이 성공적으로 등록되었습니다.',
    });
  } catch (error) {
    console.error('주문 등록 오류:', error);
    return NextResponse.json({ error: '주문을 등록하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const orders = await db.getOrders();

    // 결과를 프론트엔드에서 사용하기 쉬운 형태로 변환
    const formattedResults = orders.map((order) => ({
      id: order.id,
      member_name: order.memberName,
      is_custom_name: order.isCustomName,
      temperature: order.temperature,
      status: order.status,
      created_at: order.createdAt,
      village: order.village.name,
      menu_item: order.menuItem.name,
    }));

    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error('주문 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '주문 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
