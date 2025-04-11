import db from '../index';
import { accounts } from '../schema';
import { eq } from 'drizzle-orm';

export async function create({
  name,
  email,
  password,
  isAdmin,
}: {
  name: string;
  email: string;
  password: string;
  isAdmin: boolean;
}) {
  const result = await db.insert(accounts).values({ name, email, password, isAdmin }).returning();
  return result[0];
}

export async function findOne({ id }: { id: string }) {
  const result = await db.select().from(accounts).where(eq(accounts.id, id));
  return result[0];
}

export async function findByEmail({ email }: { email: string }) {
  const result = await db.select().from(accounts).where(eq(accounts.email, email));
  return result[0];
}

export async function update({
  id,
  name,
  email,
  password,
  isAdmin,
}: {
  id: string;
  name: string;
  email: string;
  password: string;
  isAdmin: boolean;
}) {
  const result = await db
    .update(accounts)
    .set({ name, email, password, isAdmin })
    .where(eq(accounts.id, id))
    .returning();
  return result[0];
}

export async function remove({ id }: { id: string }) {
  await db.delete(accounts).where(eq(accounts.id, id));
}
