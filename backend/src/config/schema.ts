import {
  pgTable,
  uuid,
  varchar,
  pgEnum,
  boolean,
  timestamp,
  integer,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["super_admin", "admin", "user"]);

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  isSuspended: boolean("is_suspended").notNull().default(false),
  pricePerKwh: decimal("price_per_kwh", { precision: 10, scale: 4 }),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: roleEnum("role").notNull().default("user"),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  numaraTaj: varchar("numara_taj", { length: 255 }),
  phone: varchar("phone", { length: 50 }).unique(),
  createdById: uuid("created_by_id").references((): any => users.id, {
    onDelete: "set null",
  }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const chargePoints = pgTable("charge_points", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  chargePointId: varchar("charge_point_id", { length: 255 }).notNull().unique(),
  /** Optional: OCPP Gateway identity (WebSocket path last segment). When 2.x connects as e.g. "2.0.1", set this so start charge finds the CP. */
  ocppIdentity: varchar("ocpp_identity", { length: 255 }),
  name: varchar("name", { length: 255 }),
  connectorType: varchar("connector_type", { length: 50 }),
  maxPower: integer("max_power"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ChargePoint = typeof chargePoints.$inferSelect;
export type NewChargePoint = typeof chargePoints.$inferInsert;

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  ocppTransactionId: varchar("ocpp_transaction_id", { length: 50 }),
  chargePointId: varchar("charge_point_id", { length: 255 }).notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references((): any => users.id, { onDelete: "set null" }),
  connectorId: integer("connector_id").notNull(),
  idTag: varchar("id_tag", { length: 255 }).notNull(),
  meterStart: integer("meter_start"),
  meterStop: integer("meter_stop"),
  kwh: decimal("kwh", { precision: 10, scale: 2 }),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
}));
