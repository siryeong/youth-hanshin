import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query('SELECT id, name FROM villages ORDER BY name');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('마을 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '마을 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
