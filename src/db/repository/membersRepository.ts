import db from '../index';
import { members } from '../schema';
import { eq } from 'drizzle-orm';

export async function findAll() {
  const result = await db.select().from(members);
  return result;
}

export async function findOne({ id }: { id: number }) {
  const result = await db.select().from(members).where(eq(members.id, id));
  return result[0];
}

export async function create({
  name,
  phone,
  birthDate,
  extra,
}: {
  name: string;
  phone: string | null;
  birthDate: string | null;
  extra: string | null;
}) {
  const result = await db.insert(members).values({ name, phone, birthDate, extra }).returning();
  return result[0];
}

export async function remove({ id }: { id: number }) {
  await db.delete(members).where(eq(members.id, id));
}

export async function update({
  id,
  name,
  phone,
  birthDate,
  extra,
}: {
  id: number;
  name: string;
  phone: string | null;
  birthDate: string | null;
  extra: string | null;
}) {
  const result = await db
    .update(members)
    .set({ name, phone, birthDate, extra })
    .where(eq(members.id, id))
    .returning();
  return result[0];
}
