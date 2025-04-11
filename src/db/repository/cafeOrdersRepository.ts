import db from '../index';
import { cafeOrders } from '../schema';
import { and, eq, or } from 'drizzle-orm';

export async function findAll() {
  const result = await db.query.cafeOrders.findMany({
    with: {
      member: true,
      village: true,
      cafeMenuItem: true,
    },
  });
  return result;
}

export async function findOne({ id }: { id: number }) {
  const result = await db.query.cafeOrders.findFirst({
    with: {
      member: true,
      village: true,
      cafeMenuItem: true,
    },
    where: eq(cafeOrders.id, id),
  });
  return result;
}

export async function findByMenuItemId({ cafeMenuItemId }: { cafeMenuItemId: number }) {
  const result = await db.query.cafeOrders.findMany({
    with: {
      member: true,
      village: true,
      cafeMenuItem: true,
    },
    where: eq(cafeOrders.cafeMenuItemId, cafeMenuItemId),
  });
  return result;
}

export async function findByVillageId({ villageId }: { villageId: number }) {
  const result = await db.query.cafeOrders.findMany({
    with: {
      member: true,
      village: true,
      cafeMenuItem: true,
    },
    where: eq(cafeOrders.villageId, villageId),
  });
  return result;
}

export async function findByMemberId({ memberId }: { memberId: number }) {
  const result = await db.query.cafeOrders.findMany({
    with: {
      member: true,
      village: true,
      cafeMenuItem: true,
    },
    where: eq(cafeOrders.memberId, memberId),
  });
  return result;
}

export async function findByConditions({
  villageId,
  memberId,
  customName,
}: {
  villageId?: number;
  memberId?: number;
  customName?: string;
}) {
  return db.query.cafeOrders.findMany({
    with: {
      member: true,
      village: true,
      cafeMenuItem: true,
    },
    where: and(
      villageId ? eq(cafeOrders.villageId, villageId) : undefined,
      or(
        memberId ? eq(cafeOrders.memberId, memberId) : undefined,
        customName ? eq(cafeOrders.customName, customName) : undefined,
      ),
    ),
  });
}

export async function create({
  villageId,
  memberId,
  cafeMenuItemId,
  customName,
  options,
}: {
  villageId: number;
  memberId?: number;
  cafeMenuItemId: number;
  customName?: string;
  options: Record<string, string | null>;
}) {
  const [{ id }] = await db
    .insert(cafeOrders)
    .values({ villageId, memberId, cafeMenuItemId, customName, options, status: 'pending' })
    .returning();

  const response = await db.query.cafeOrders.findFirst({
    with: {
      member: true,
      village: true,
      cafeMenuItem: true,
    },
    where: eq(cafeOrders.id, id),
  });
  return response;
}

export async function update({
  id,
  villageId,
  memberId,
  cafeMenuItemId,
  customName,
  options,
}: {
  id: number;
  villageId?: number;
  memberId?: number;
  cafeMenuItemId?: number;
  customName?: string;
  options?: Record<string, string | null>;
}) {
  await db
    .update(cafeOrders)
    .set({ villageId, memberId, cafeMenuItemId, customName, options })
    .where(eq(cafeOrders.id, id));

  const response = await db.query.cafeOrders.findFirst({
    with: {
      member: true,
      village: true,
      cafeMenuItem: true,
    },
    where: eq(cafeOrders.id, id),
  });
  return response;
}

export async function remove({ id }: { id: number }) {
  await db.delete(cafeOrders).where(eq(cafeOrders.id, id));
}

export async function updateStatus({ id, status }: { id: number; status: string }) {
  await db.update(cafeOrders).set({ status }).where(eq(cafeOrders.id, id));

  const response = await db.query.cafeOrders.findFirst({
    with: {
      member: true,
      village: true,
      cafeMenuItem: true,
    },
    where: eq(cafeOrders.id, id),
  });
  return response;
}
