import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const beatsTable = pgTable("beats", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  beatType: text("beat_type"),
  orderIndex: integer("order_index").notNull().default(0),
  pageTarget: integer("page_target"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBeatSchema = createInsertSchema(beatsTable).omit({ id: true, createdAt: true });
export type InsertBeat = z.infer<typeof insertBeatSchema>;
export type Beat = typeof beatsTable.$inferSelect;
