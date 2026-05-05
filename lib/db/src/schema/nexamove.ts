import { pgTable, serial, text, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["customer", "rider"] }).notNull().default("customer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const shopsTable = pgTable("shops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  rating: real("rating").notNull().default(4.5),
  imageUrl: text("image_url").notNull(),
  isOpen: boolean("is_open").notNull().default(true),
});

export const insertShopSchema = createInsertSchema(shopsTable).omit({ id: true });
export type InsertShop = z.infer<typeof insertShopSchema>;
export type Shop = typeof shopsTable.$inferSelect;

export const ridersTable = pgTable("riders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  lat: real("lat"),
  lng: real("lng"),
  isAvailable: boolean("is_available").notNull().default(true),
  currentOrderId: integer("current_order_id"),
});

export const insertRiderSchema = createInsertSchema(ridersTable).omit({ id: true });
export type InsertRider = z.infer<typeof insertRiderSchema>;
export type Rider = typeof ridersTable.$inferSelect;

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => usersTable.id),
  shopId: integer("shop_id").notNull().references(() => shopsTable.id),
  riderId: integer("rider_id"),
  status: text("status", { enum: ["preparing", "on_the_way", "delivered"] }).notNull().default("preparing"),
  customerLat: real("customer_lat").notNull(),
  customerLng: real("customer_lng").notNull(),
  items: text("items"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
