import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const workspaceSettingsTable = pgTable("workspace_settings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("My Studio"),
  description: text("description"),
  logoUrl: text("logo_url"),
  accentColor: text("accent_color"),
  studioType: text("studio_type"),
  location: text("location"),
  website: text("website"),
  socialLinks: text("social_links"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWorkspaceSettingsSchema = createInsertSchema(workspaceSettingsTable);
