import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mindMapNodesTable = pgTable("mind_map_nodes", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  label: text("label").notNull(),
  nodeType: text("node_type"),
  parentId: integer("parent_id"),
  positionX: real("position_x"),
  positionY: real("position_y"),
  color: text("color"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMindMapNodeSchema = createInsertSchema(mindMapNodesTable).omit({ id: true, createdAt: true });
export type InsertMindMapNode = z.infer<typeof insertMindMapNodeSchema>;
export type MindMapNode = typeof mindMapNodesTable.$inferSelect;
