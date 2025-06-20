import { NextRequest, NextResponse } from 'next/server';
import db from '@/db';
import { eventParticipants } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { name, villageId } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 });
    }

    if (!villageId) {
      return NextResponse.json({ error: '마을을 선택해주세요.' }, { status: 400 });
    }

    // 참가자 등록 (마을 + 이름 조합이 유니크해야 함)
    try {
      const [participant] = await db
        .insert(eventParticipants)
        .values({
          name: name.trim(),
          villageId: parseInt(villageId),
        })
        .returning();

      // 마을 정보와 함께 반환
      const participantWithVillage = await db.query.eventParticipants.findFirst({
        where: eq(eventParticipants.id, participant.id),
        with: { village: true },
      });

      return NextResponse.json(participantWithVillage);
    } catch (error) {
      // 유니크 제약 조건 위반 (같은 마을에 같은 이름이 이미 존재)
      if (
        error instanceof Error &&
        'code' in error &&
        (error as { code: string }).code === '23505'
      ) {
        return NextResponse.json(
          {
            error: '해당 마을에 이미 같은 이름의 참가자가 등록되어 있습니다.',
          },
          { status: 400 },
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('참가자 등록 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
