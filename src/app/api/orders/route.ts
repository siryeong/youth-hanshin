import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

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
    const villageResult = await query('SELECT id FROM villages WHERE name = $1', [village]);
    if (villageResult.rows.length === 0) {
      return NextResponse.json({ error: '존재하지 않는 마을입니다.' }, { status: 400 });
    }
    const villageId = villageResult.rows[0].id;

    // 주문 정보 저장
    const orderResult = await query(
      `INSERT INTO orders 
        (village_id, member_name, is_custom_name, menu_item_id, temperature, status) 
       VALUES 
        ($1, $2, $3, $4, $5, 'pending') 
       RETURNING id`,
      [villageId, name, isCustomName, menuItemId, temperature || null],
    );

    return NextResponse.json({
      success: true,
      orderId: orderResult.rows[0].id,
      message: '주문이 성공적으로 등록되었습니다.',
    });
  } catch (error) {
    console.error('주문 등록 오류:', error);
    return NextResponse.json({ error: '주문을 등록하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        o.id, 
        v.name as village, 
        o.member_name, 
        o.is_custom_name, 
        m.name as menu_item, 
        o.temperature, 
        o.status, 
        o.created_at
      FROM 
        orders o
      JOIN 
        villages v ON o.village_id = v.id
      JOIN 
        menu_items m ON o.menu_item_id = m.id
      ORDER BY 
        o.created_at DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('주문 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '주문 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
