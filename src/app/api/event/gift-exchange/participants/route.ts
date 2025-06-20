import { NextRequest, NextResponse } from 'next/server';
import db from '@/db';
import { eventParticipants } from '@/db/schema';
import { ne } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const excludeId = searchParams.get('exclude');

    if (excludeId) {
      const participants = await db.query.eventParticipants.findMany({
        where: ne(eventParticipants.id, parseInt(excludeId)),
        with: { village: true },
        orderBy: (eventParticipants, { desc }) => [desc(eventParticipants.createdAt)],
      });
      return NextResponse.json(participants);
    }

    const participants = await db.query.eventParticipants.findMany({
      with: { village: true },
      orderBy: (eventParticipants, { desc }) => [desc(eventParticipants.createdAt)],
    });

    return NextResponse.json(participants);
  } catch (error) {
    console.error('참가자 목록 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
