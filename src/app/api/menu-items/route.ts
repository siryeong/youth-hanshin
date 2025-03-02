import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let sql = `
      SELECT 
        m.id, 
        m.name, 
        m.description, 
        c.name as category, 
        m.image_path as image, 
        m.is_temperature_required
      FROM 
        menu_items m
      JOIN 
        menu_categories c ON m.category_id = c.id
    `;

    const params: string[] = [];

    if (category) {
      sql += ' WHERE c.name = $1';
      params.push(category);
    }

    sql += ' ORDER BY m.name';

    const result = await query(sql, params);

    // 결과를 프론트엔드에서 사용하기 쉬운 형태로 변환
    const formattedResults = result.rows.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      image: item.image,
      requiresTemperature: item.is_temperature_required,
    }));

    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error('메뉴 아이템 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '메뉴 아이템 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
