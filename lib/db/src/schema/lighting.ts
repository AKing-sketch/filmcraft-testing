import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const lightingDiagramsTable = pgTable("lighting_diagrams", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  sceneId: integer("scene_id"),
  canvasData: text("canvas_data"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLightingDiagramSchema = createInsertSchema(lightingDiagramsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLightingDiagram = z.infer<typeof insertLightingDiagramSchema>;
export type LightingDiagram = typeof lightingDiagramsTable.$inferSelect;
