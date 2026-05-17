import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productionToolsTable = pgTable("production_tools", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  purpose: text("purpose"),
  externalLink: text("external_link"),
  projectNotes: text("project_notes"),
  workflowNotes: text("workflow_notes"),
  assignedUser: text("assigned_user"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductionToolSchema = createInsertSchema(productionToolsTable).omit({ id: true, createdAt: true });
export type InsertProductionTool = z.infer<typeof insertProductionToolSchema>;
export type ProductionTool = typeof productionToolsTable.$inferSelect;
