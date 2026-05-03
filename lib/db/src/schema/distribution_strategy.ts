import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const distributionStrategyTable = pgTable("distribution_strategy", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().unique(),
  tagline: text("tagline"),
  shortSynopsis: text("short_synopsis"),
  longSynopsis: text("long_synopsis"),
  directorStatement: text("director_statement"),
  directorBio: text("director_bio"),
  producerBio: text("producer_bio"),
  runtimeMinutes: integer("runtime_minutes"),
  aspectRatio: text("aspect_ratio"),
  soundFormat: text("sound_format"),
  language: text("language"),
  countryOfOrigin: text("country_of_origin"),
  subtitles: text("subtitles"),
  targetAudience: text("target_audience"),
  festivalStrategy: text("festival_strategy"),
  releaseStrategy: text("release_strategy"),
  socialLinks: text("social_links"),
  pressContact: text("press_contact"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDistributionStrategySchema = createInsertSchema(distributionStrategyTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDistributionStrategy = z.infer<typeof insertDistributionStrategySchema>;
export type DistributionStrategy = typeof distributionStrategyTable.$inferSelect;
