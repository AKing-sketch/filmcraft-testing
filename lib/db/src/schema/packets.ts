import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productionPacketsTable = pgTable("production_packets", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  packetType: text("packet_type").notNull(),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductionPacketSchema = createInsertSchema(productionPacketsTable).omit({ id: true, createdAt: true });
export type InsertProductionPacket = z.infer<typeof insertProductionPacketSchema>;
export type ProductionPacket = typeof productionPacketsTable.$inferSelect;
