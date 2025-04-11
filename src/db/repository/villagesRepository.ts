import db from '../index';
import { villages, villageMembers } from '../schema';
import { eq, and, notInArray } from 'drizzle-orm';

export async function findAll() {
  const result = await db.select().from(villages);
  return result;
}

export async function findAllWithMembers() {
  const result = await db.query.villages.findMany({
    with: {
      villageMembers: {
        with: {
          member: true,
        },
      },
    },
  });
  return result.map((village) => ({
    ...village,
    members: village.villageMembers.map((villageMember) => villageMember.member),
  }));
}

export async function findOneWithMembers({ id }: { id: number }) {
  const result = await db.query.villages.findFirst({
    with: {
      villageMembers: {
        with: {
          member: true,
        },
      },
    },
    where: eq(villages.id, id),
  });

  if (!result) {
    return {};
  }

  return {
    ...result,
    members: result.villageMembers.map((villageMember) => villageMember.member),
  };
}

export async function create({ name }: { name: string }) {
  const result = await db.insert(villages).values({ name }).returning();
  return result[0];
}

export async function update({ id, name }: { id: number; name: string }) {
  const result = await db.update(villages).set({ name }).where(eq(villages.id, id)).returning();
  return result[0];
}

export async function remove({ id }: { id: number }) {
  await db.delete(villages).where(eq(villages.id, id));
}

/**
 * 마을 멤버 일괄 업데이트 함수
 * @param villageId 마을 ID
 * @param memberIds 새로운 멤버 ID 목록
 * @returns 업데이트된 마을 정보
 */
export async function updateVillageMembers({
  villageId,
  memberIds,
}: {
  villageId: number;
  memberIds: number[];
}) {
  // 트랜잭션 시작
  return await db.transaction(async (tx) => {
    // 1. 기존 마을 멤버 중 새 목록에 없는 멤버 삭제
    await tx
      .delete(villageMembers)
      .where(
        and(
          eq(villageMembers.villageId, villageId),
          notInArray(villageMembers.memberId, memberIds),
        ),
      );

    // 2. 현재 마을에 있는 멤버 ID 목록 조회
    const existingMembers = await tx
      .select({ memberId: villageMembers.memberId })
      .from(villageMembers)
      .where(eq(villageMembers.villageId, villageId));

    const existingMemberIds = existingMembers.map((m) => m.memberId);

    // 3. 새로 추가할 멤버 ID 목록 (기존에 없는 것만)
    const newMemberIds = memberIds.filter((id) => !existingMemberIds.includes(id));

    // 4. 새 멤버 추가
    if (newMemberIds.length > 0) {
      await tx.insert(villageMembers).values(
        newMemberIds.map((memberId) => ({
          villageId,
          memberId,
        })),
      );
    }

    // 5. 업데이트된 마을 정보 반환
    const updatedVillage = await tx.query.villages.findFirst({
      with: {
        villageMembers: {
          with: {
            member: true,
          },
        },
      },
      where: eq(villages.id, villageId),
    });

    if (!updatedVillage) {
      throw new Error('마을을 찾을 수 없습니다.');
    }

    return {
      ...updatedVillage,
      members: updatedVillage.villageMembers.map((vm) => vm.member),
    };
  });
}
