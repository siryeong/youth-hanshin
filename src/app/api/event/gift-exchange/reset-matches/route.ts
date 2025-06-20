import { NextResponse } from 'next/server';
import db from '@/db';
import { giftExchangeMatches } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE() {
  try {
    const eventId = new Date().toISOString().split('T')[0];

    await db.delete(giftExchangeMatches).where(eq(giftExchangeMatches.eventId, eventId));

    return NextResponse.json({ message: '매칭이 초기화되었습니다.' });
  } catch (error) {
    console.error('매칭 초기화 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
