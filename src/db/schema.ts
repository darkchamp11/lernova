import { relations } from 'drizzle-orm';
import { integer, json, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

// Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  knowledgeVec: json('knowledge_vec').$type<number[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Content Table (Courses/Learning Materials)
export const content = pgTable('content', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  topic: varchar('topic', { length: 100 }).notNull(),
  difficulty: varchar('difficulty', { length: 50 }).notNull(), // beginner, intermediate, advanced
  keywords: json('keywords').$type<string[]>().default([]),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Progress Table
export const progress = pgTable('progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  contentId: integer('content_id')
    .notNull()
    .references(() => content.id, { onDelete: 'cascade' }),
  score: integer('score').default(0), // 0-100
  timeSpent: integer('time_spent').default(0), // in minutes
  completed: integer('completed').default(0), // 0 or 1 (boolean)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  progress: many(progress),
}));

export const contentRelations = relations(content, ({ many }) => ({
  progress: many(progress),
}));

export const progressRelations = relations(progress, ({ one }) => ({
  user: one(users, {
    fields: [progress.userId],
    references: [users.id],
  }),
  content: one(content, {
    fields: [progress.contentId],
    references: [content.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Content = typeof content.$inferSelect;
export type NewContent = typeof content.$inferInsert;

export type Progress = typeof progress.$inferSelect;
export type NewProgress = typeof progress.$inferInsert;
