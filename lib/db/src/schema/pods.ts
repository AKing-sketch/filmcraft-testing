import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const podBoardsTable = pgTable("pod_boards", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  boardType: text("board_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  items: text("items").default("[]"),
  position: integer("position").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPodBoardSchema = createInsertSchema(podBoardsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPodBoard = z.infer<typeof insertPodBoardSchema>;
export type PodBoard = typeof podBoardsTable.$inferSelect;

export const podAssetsTable = pgTable("pod_assets", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  assetType: text("asset_type"),
  description: text("description"),
  status: text("status").default("available"),
  url: text("url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPodAssetSchema = createInsertSchema(podAssetsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPodAsset = z.infer<typeof insertPodAssetSchema>;
export type PodAsset = typeof podAssetsTable.$inferSelect;

export const podDeadlinesTable = pgTable("pod_deadlines", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  title: text("title").notNull(),
  dueDate: text("due_date"),
  assignee: text("assignee"),
  priority: text("priority").default("normal"),
  status: text("status").default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPodDeadlineSchema = createInsertSchema(podDeadlinesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPodDeadline = z.infer<typeof insertPodDeadlineSchema>;
export type PodDeadline = typeof podDeadlinesTable.$inferSelect;
