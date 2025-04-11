import db from '../index';
import { cafeSettings } from '../schema';
import { eq } from 'drizzle-orm';

export async function findAll() {
  const results = await db.select().from(cafeSettings);
  return results;
}

export async function findOne() {
  const result = await db.select().from(cafeSettings).limit(1);
  return result[0];
}

export async function create({
  openingTime,
  closingTime,
  openDays,
}: {
  openingTime: string;
  closingTime: string;
  openDays: number[];
}) {
  const result = await db
    .insert(cafeSettings)
    .values({ openingTime, closingTime, openDays })
    .returning();
  return result[0];
}

export async function update({
  id,
  openingTime,
  closingTime,
  openDays,
}: {
  id: number;
  openingTime: string;
  closingTime: string;
  openDays: number[];
}) {
  const result = await db
    .update(cafeSettings)
    .set({ openingTime, closingTime, openDays })
    .where(eq(cafeSettings.id, id))
    .returning();
  return result[0];
}
