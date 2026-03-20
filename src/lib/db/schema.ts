import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const flags = pgTable("flags", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(), // e.g., "new-hero-section"
  description: text("description"),
  isEnabled: boolean("is_enabled").notNull().default(false), // Global Kill-switch

  // This is where the magic happens
  strategy: jsonb("strategy").notNull().default({ type: "boolean" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
