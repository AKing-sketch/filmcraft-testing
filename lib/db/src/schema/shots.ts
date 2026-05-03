import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shotsTable = pgTable("shots", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  sceneId: integer("scene_id"),
  shotNumber: text("shot_number").notNull(),
  description: text("description"),
  shotType: text("shot_type"),
  cameraMovement: text("camera_movement"),
  lens: text("lens"),
  duration: text("duration"),
  audioNotes: text("audio_notes"),
  lightingNotes: text("lighting_notes"),
  status: text("status").default("planned"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertShotSchema = createInsertSchema(shotsTable).omit({ id: true, createdAt: true });
export type InsertShot = z.infer<typeof insertShotSchema>;
export type Shot = typeof shotsTable.$inferSelect;
