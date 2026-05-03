import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const castingCallsTable = pgTable("casting_calls", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  characterName: text("character_name").notNull(),
  role: text("role"),
  description: text("description"),
  ageRange: text("age_range"),
  skills: text("skills"),
  auditionDate: text("audition_date"),
  auditionLocation: text("audition_location"),
  status: text("status").default("open"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCastingCallSchema = createInsertSchema(castingCallsTable).omit({ id: true, createdAt: true });
export type InsertCastingCall = z.infer<typeof insertCastingCallSchema>;
export type CastingCall = typeof castingCallsTable.$inferSelect;

export const castMembersTable = pgTable("cast_members", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  actorName: text("actor_name").notNull(),
  characterName: text("character_name"),
  role: text("role"),
  contact: text("contact"),
  agent: text("agent"),
  rate: real("rate"),
  availability: text("availability"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCastMemberSchema = createInsertSchema(castMembersTable).omit({ id: true, createdAt: true });
export type InsertCastMember = z.infer<typeof insertCastMemberSchema>;
export type CastMember = typeof castMembersTable.$inferSelect;
