import { NextResponse } from 'next/server';
import { findAll } from '@/db/repository/cafeOrdersRepository';

// 관리자 전용 주문 목록 조회
export async function GET() {
  try {
    const orders = await findAll();
    return NextResponse.json(orders);
  } catch (error) {
    console.error('주문 목록 조회 오류:', error);
    return NextResponse.json({ error: '주문 목록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
