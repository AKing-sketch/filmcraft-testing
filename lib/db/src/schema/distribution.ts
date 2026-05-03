import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const distributionEntriesTable = pgTable("distribution_entries", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  type: text("type").notNull().default("festival"),
  name: text("name").notNull(),
  status: text("status").notNull().default("considering"),
  submissionDate: text("submission_date"),
  responseDate: text("response_date"),
  response: text("response"),
  notes: text("notes"),
  url: text("url"),
  fee: real("fee"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDistributionEntrySchema = createInsertSchema(distributionEntriesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDistributionEntry = z.infer<typeof insertDistributionEntrySchema>;
export type DistributionEntry = typeof distributionEntriesTable.$inferSelect;
