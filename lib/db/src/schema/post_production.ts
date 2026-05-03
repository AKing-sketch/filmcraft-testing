import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const postMilestonesTable = pgTable("post_milestones", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull().default("edit"),
  status: text("status").notNull().default("pending"),
  dueDate: text("due_date"),
  completedDate: text("completed_date"),
  notes: text("notes"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const deliverablesTable = pgTable("deliverables", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  format: text("format"),
  specs: text("specs"),
  recipient: text("recipient"),
  dueDate: text("due_date"),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPostMilestoneSchema = createInsertSchema(postMilestonesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPostMilestone = z.infer<typeof insertPostMilestoneSchema>;
export type PostMilestone = typeof postMilestonesTable.$inferSelect;

export const insertDeliverableSchema = createInsertSchema(deliverablesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDeliverable = z.infer<typeof insertDeliverableSchema>;
export type Deliverable = typeof deliverablesTable.$inferSelect;
