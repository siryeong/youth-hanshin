import db from '../index';
import { cafeMenuItems } from '../schema';
import { eq } from 'drizzle-orm';

export async function findAll() {
  const result = await db.select().from(cafeMenuItems);
  return result;
}

export async function findOne({ id }: { id: number }) {
  const result = await db.select().from(cafeMenuItems).where(eq(cafeMenuItems.id, id));
  return result[0];
}

export async function remove({ id }: { id: number }) {
  await db.delete(cafeMenuItems).where(eq(cafeMenuItems.id, id));
}

export async function update({
  id,
  name,
  price,
  description,
  requiredOptions,
  category,
}: {
  id: number;
  name: string;
  price: number;
  description: string;
  requiredOptions: Record<string, boolean>;
  category: 'coffee' | 'tea' | 'beverage';
}) {
  const result = await db
    .update(cafeMenuItems)
    .set({ name, price, description, requiredOptions, category })
    .where(eq(cafeMenuItems.id, id))
    .returning();
  return result[0];
}

export async function create({
  name,
  price,
  description,
  requiredOptions,
  category,
}: {
  name: string;
  price: number;
  description: string;
  requiredOptions: Record<string, boolean>;
  category: 'coffee' | 'tea' | 'beverage';
}) {
  const result = await db
    .insert(cafeMenuItems)
    .values({ name, price, description, requiredOptions, category })
    .returning();
  return result[0];
}
