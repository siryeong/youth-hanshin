import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// 계정
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  password: text('password').notNull(),
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 멤버
export const members = pgTable('members', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  birthDate: text('birth_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 마을
export const villages = pgTable('villages', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const villagesRelations = relations(villages, ({ many }) => ({
  villageMembers: many(villageMembers),
}));

export const membersRelations = relations(members, ({ many }) => ({
  villageMembers: many(villageMembers),
}));

export const villageMembers = pgTable(
  'village_members',
  {
    villageId: integer('village_id')
      .notNull()
      .references(() => villages.id),
    memberId: integer('member_id')
      .notNull()
      .references(() => members.id),
  },
  (t) => [primaryKey({ columns: [t.villageId, t.memberId] })],
);

export const villageMembersRelations = relations(villageMembers, ({ one }) => ({
  village: one(villages, {
    fields: [villageMembers.villageId],
    references: [villages.id],
  }),
  member: one(members, {
    fields: [villageMembers.memberId],
    references: [members.id],
  }),
}));

// 카페 메뉴 아이템
export const cafeMenuItemCategories = pgEnum('cafe_menu_item_categories', [
  'coffee',
  'tea',
  'beverage',
]);

export const cafeMenuItems = pgTable('cafe_menu_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price'),
  requiredOptions: jsonb('required_options').default({ temperature: false, strength: false }),
  category: cafeMenuItemCategories('category').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const cafeOrders = pgTable('cafe_orders', {
  id: serial('id').primaryKey(),
  villageId: integer('village_id')
    .notNull()
    .references(() => villages.id),
  memberId: integer('member_id').references(() => members.id),
  cafeMenuItemId: integer('cafe_menu_item_id')
    .notNull()
    .references(() => cafeMenuItems.id),
  customName: text('custom_name'),
  options: jsonb('options').default({ temperature: null, strength: null }),
  status: text('status').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const cafeOrdersRelations = relations(cafeOrders, ({ one }) => ({
  cafeMenuItem: one(cafeMenuItems, {
    fields: [cafeOrders.cafeMenuItemId],
    references: [cafeMenuItems.id],
  }),
  member: one(members, {
    fields: [cafeOrders.memberId],
    references: [members.id],
  }),
  village: one(villages, {
    fields: [cafeOrders.villageId],
    references: [villages.id],
  }),
}));

export const cafeSettings = pgTable('cafe_settings', {
  id: serial('id').primaryKey(),
  openingTime: text('opening_time').notNull(),
  closingTime: text('closing_time').notNull(),
  openDays: integer('open_days').array().notNull(),
});
