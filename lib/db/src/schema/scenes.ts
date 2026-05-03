import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scenesTable = pgTable("scenes", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  sceneNumber: integer("scene_number").notNull(),
  heading: text("heading").notNull(),
  intExt: text("int_ext"),
  location: text("location"),
  timeOfDay: text("time_of_day"),
  synopsis: text("synopsis"),
  pages: real("pages"),
  characters: text("characters"),
  props: text("props"),
  costumes: text("costumes"),
  makeupFx: text("makeup_fx"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSceneSchema = createInsertSchema(scenesTable).omit({ id: true, createdAt: true });
export type InsertScene = z.infer<typeof insertSceneSchema>;
export type Scene = typeof scenesTable.$inferSelect;
