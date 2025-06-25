import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reflections table
export const reflections = pgTable("reflections", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  questionId: integer("question_id").notNull(),
  questionText: text("question_text").notNull(),
  userResponse: text("user_response"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Analysis table
export const analysis = pgTable("analysis", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  selfDiscoveries: jsonb("self_discoveries").$type<string[]>(),
  analysisTimestamp: timestamp("analysis_timestamp").defaultNow(),
});

// Final learnings table
export const finalLearnings = pgTable("final_learnings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  selfWrittenLearnings: text("self_written_learnings"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  reflections: many(reflections),
  analysis: many(analysis),
  finalLearnings: many(finalLearnings),
}));

export const reflectionsRelations = relations(reflections, ({ one }) => ({
  user: one(users, {
    fields: [reflections.userId],
    references: [users.id],
  }),
}));

export const analysisRelations = relations(analysis, ({ one }) => ({
  user: one(users, {
    fields: [analysis.userId],
    references: [users.id],
  }),
}));

export const finalLearningsRelations = relations(finalLearnings, ({ one }) => ({
  user: one(users, {
    fields: [finalLearnings.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertReflectionSchema = createInsertSchema(reflections).omit({
  id: true,
  updatedAt: true,
});

export const insertAnalysisSchema = createInsertSchema(analysis).omit({
  id: true,
  analysisTimestamp: true,
});

export const insertFinalLearningsSchema = createInsertSchema(finalLearnings).omit({
  id: true,
  submittedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Reflection = typeof reflections.$inferSelect;
export type InsertReflection = z.infer<typeof insertReflectionSchema>;
export type Analysis = typeof analysis.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type FinalLearning = typeof finalLearnings.$inferSelect;
export type InsertFinalLearning = z.infer<typeof insertFinalLearningsSchema>;
