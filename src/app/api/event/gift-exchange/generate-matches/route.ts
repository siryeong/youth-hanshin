import { NextResponse } from 'next/server';
import db from '@/db';
import { giftExchangeMatches } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Fisher-Yates shuffle 알고리즘으로 배열을 랜덤하게 섞기
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function POST() {
  try {
    // 모든 참가자 가져오기
    const participants = await db.query.eventParticipants.findMany({
      with: { village: true },
    });

    if (participants.length < 2) {
      return NextResponse.json({ error: '참가자가 최소 2명 이상이어야 합니다.' }, { status: 400 });
    }

    // 기존 매칭 삭제
    const eventId = new Date().toISOString().split('T')[0];
    await db.delete(giftExchangeMatches).where(eq(giftExchangeMatches.eventId, eventId));

    // 참가자 리스트를 두 번 복사하여 섞기
    const givers = shuffleArray(participants);
    const receivers = shuffleArray(participants);

    // 자기 자신에게 선물을 주지 않도록 조정
    for (let i = 0; i < givers.length; i++) {
      if (givers[i].id === receivers[i].id) {
        // 다음 사람과 바꾸기 (마지막 인덱스인 경우 이전 사람과 바꾸기)
        const swapIndex = i === receivers.length - 1 ? i - 1 : i + 1;

        // swap이 또 다른 자기 자신 매칭을 만들지 않는지 확인
        if (givers[swapIndex].id !== receivers[i].id && givers[i].id !== receivers[swapIndex].id) {
          [receivers[i], receivers[swapIndex]] = [receivers[swapIndex], receivers[i]];
        } else {
          // 더 복잡한 경우, 적절한 위치 찾기
          for (let j = 0; j < receivers.length; j++) {
            if (j !== i && givers[i].id !== receivers[j].id && givers[j].id !== receivers[i].id) {
              [receivers[i], receivers[j]] = [receivers[j], receivers[i]];
              break;
            }
          }
        }
      }
    }

    // 매칭 생성
    const matchesToInsert = givers.map((giver, index) => ({
      eventId,
      giverId: giver.id,
      receiverId: receivers[index].id,
      isRevealed: false,
    }));

    await db.insert(giftExchangeMatches).values(matchesToInsert);

    // 생성된 매칭 조회하여 반환
    const createdMatches = await db.query.giftExchangeMatches.findMany({
      where: eq(giftExchangeMatches.eventId, eventId),
      with: {
        giver: { with: { village: true } },
        receiver: { with: { village: true } },
      },
      orderBy: (giftExchangeMatches, { asc }) => [asc(giftExchangeMatches.id)],
    });

    return NextResponse.json({
      message: `${createdMatches.length}개의 매칭이 생성되었습니다.`,
      matches: createdMatches,
    });
  } catch (error) {
    console.error('매칭 생성 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
