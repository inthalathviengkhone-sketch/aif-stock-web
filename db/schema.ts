import { pgTable, text, integer, boolean, primaryKey, serial, bigint } from "drizzle-orm/pg-core";

export const warehouses = pgTable("warehouses", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"),
  isMain: boolean("is_main").default(false),
  createdAt: text("created_at").notNull(),
});

export const products = pgTable("products", {
  warehouseId: text("warehouse_id").notNull().references(() => warehouses.id, { onDelete: "cascade" }),
  id: text("id").notNull(), // Product SKU/code e.g. FB001
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  price: integer("price").notNull().default(0),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(10),
}, (table) => ({
  pk: primaryKey({ columns: [table.warehouseId, table.id] }),
}));

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  warehouseId: text("warehouse_id").notNull().references(() => warehouses.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull(),
  type: text("type").notNull(), // 'in' or 'out'
  quantity: integer("quantity").notNull(),
  note: text("note"),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
});

export const users = pgTable("users", {
  username: text("username").primaryKey(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'admin', 'manager', 'viewer'
  fullname: text("fullname"),
  createdAt: text("created_at").notNull(),
});
