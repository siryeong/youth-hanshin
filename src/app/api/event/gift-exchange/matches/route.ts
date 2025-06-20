import { NextResponse } from 'next/server';
import db from '@/db';
import { giftExchangeMatches } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const eventId = new Date().toISOString().split('T')[0];

    const matches = await db.query.giftExchangeMatches.findMany({
      where: eq(giftExchangeMatches.eventId, eventId),
      with: {
        giver: { with: { village: true } },
        receiver: { with: { village: true } },
      },
      orderBy: (giftExchangeMatches, { asc }) => [asc(giftExchangeMatches.id)],
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error('매칭 결과 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 매칭 완료 상태 업데이트
export async function PATCH(request: Request) {
  try {
    const { matchId, isCompleted } = await request.json();

    if (!matchId) {
      return NextResponse.json({ error: '매칭 ID가 필요합니다.' }, { status: 400 });
    }

    await db
      .update(giftExchangeMatches)
      .set({ isRevealed: isCompleted })
      .where(eq(giftExchangeMatches.id, matchId));

    return NextResponse.json({ message: '매칭 상태가 업데이트되었습니다.' });
  } catch (error) {
    console.error('매칭 상태 업데이트 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
