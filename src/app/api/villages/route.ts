import { NextResponse } from 'next/server';
import { getDbClient, getDatabaseType, pgQuery, type Village } from '@/lib/db-manager';

export async function GET() {
  try {
    const databaseType = getDatabaseType();
    const dbClient = getDbClient();

    if (databaseType === 'supabase') {
      // Supabase 사용
      const supabase = dbClient as ReturnType<typeof import('@supabase/supabase-js').createClient>;
      const { data, error } = await supabase.from('villages').select('id, name').order('name');

      if (error) {
        throw error;
      }

      return NextResponse.json(data as Village[]);
    } else {
      // PostgreSQL 사용
      const result = await pgQuery('SELECT id, name FROM villages ORDER BY name');
      return NextResponse.json(result.rows as Village[]);
    }
  } catch (error) {
    console.error('마을 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '마을 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
