import { NextResponse } from 'next/server';
import { getDbClient, getDatabaseType, pgQuery } from '@/lib/db-manager';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const databaseType = getDatabaseType();
    const dbClient = getDbClient();

    if (databaseType === 'supabase') {
      // Supabase 사용
      const supabase = dbClient as ReturnType<typeof import('@supabase/supabase-js').createClient>;
      let query = supabase
        .from('menu_items')
        .select(
          `
          id, 
          name, 
          description, 
          image_path,
          is_temperature_required,
          menu_categories(name)
        `,
        )
        .order('name');

      if (category) {
        query = query.eq('menu_categories.name', category);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // 결과를 프론트엔드에서 사용하기 쉬운 형태로 변환
      const formattedResults = data.map((item) => {
        // Supabase 외래 키 관계 처리
        const categoryName =
          item.menu_categories &&
          Array.isArray(item.menu_categories) &&
          item.menu_categories.length > 0
            ? item.menu_categories[0].name
            : '';

        return {
          id: item.id,
          name: item.name,
          description: item.description,
          category: categoryName,
          image: item.image_path,
          requiresTemperature: item.is_temperature_required,
        };
      });

      return NextResponse.json(formattedResults);
    } else {
      // PostgreSQL 사용
      let query = `
        SELECT 
          mi.id, 
          mi.name, 
          mi.description, 
          mi.image_path,
          mi.is_temperature_required,
          mc.name as category_name
        FROM 
          menu_items mi
        JOIN 
          menu_categories mc ON mi.category_id = mc.id
      `;

      const params: string[] = [];

      if (category) {
        query += ' WHERE mc.name = $1';
        params.push(category);
      }

      query += ' ORDER BY mi.name';

      const result = await pgQuery(query, params);

      // 결과를 프론트엔드에서 사용하기 쉬운 형태로 변환
      const formattedResults = result.rows.map(
        (item: {
          id: number;
          name: string;
          description: string;
          image_path: string;
          is_temperature_required: boolean;
          category_name: string;
        }) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          category: item.category_name,
          image: item.image_path,
          requiresTemperature: item.is_temperature_required,
        }),
      );

      return NextResponse.json(formattedResults);
    }
  } catch (error) {
    console.error('메뉴 아이템 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '메뉴 아이템 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
