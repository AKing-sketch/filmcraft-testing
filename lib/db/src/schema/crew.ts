import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const crewMembersTable = pgTable("crew_members", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  department: text("department"),
  title: text("title"),
  contact: text("contact"),
  rate: real("rate"),
  availability: text("availability"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCrewMemberSchema = createInsertSchema(crewMembersTable).omit({ id: true, createdAt: true });
export type InsertCrewMember = z.infer<typeof insertCrewMemberSchema>;
export type CrewMember = typeof crewMembersTable.$inferSelect;
