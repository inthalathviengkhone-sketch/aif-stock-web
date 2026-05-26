import type { Config } from "@netlify/functions";
import { and, eq, notInArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import { warehouses, products, transactions, users } from "../../db/schema.js";

async function seedDatabaseIfEmpty() {
  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length === 0) {
    // Seed Users
    await db.insert(users).values([
      { username: "admin", password: "admin123", role: "admin", fullname: "ຜູ້ຈັດການສູງສຸດ", createdAt: new Date().toISOString() },
      { username: "manager", password: "manager123", role: "manager", fullname: "ຜູ້ຈັດການສາງ", createdAt: new Date().toISOString() },
      { username: "viewer", password: "viewer123", role: "viewer", fullname: "ຜູ້ເບິ່ງຂໍ້ມູນ", createdAt: new Date().toISOString() }
    ]);

    // Seed Warehouses
    await db.insert(warehouses).values([
      { id: "warehouse_1", name: "ຂົວມິດຕະພາບ", location: "ນະຄອນຫຼວງວຽງຈັນ", isMain: true, createdAt: new Date().toISOString() },
      { id: "warehouse_2", name: "ສາງ AIF", location: "ນະຄອນຫຼວງວຽງຈັນ", isMain: true, createdAt: new Date().toISOString() }
    ]);

    // Seed Products
    await db.insert(products).values([
      { warehouseId: "warehouse_1", id: "FB001", name: "ປິ່ນເຕີ້", unit: "ເຄື່ອງ", price: 0, stock: 10, minStock: 5 },
      { warehouseId: "warehouse_1", id: "FB003", name: "ກໍ້ເຈ້ຍບີນ", unit: "ກໍ້", price: 0, stock: 40, minStock: 20 },
      { warehouseId: "warehouse_1", id: "FB004", name: "ກໍ້ເຈ້ຍ QR CODE", unit: "ກໍ້", price: 0, stock: 41, minStock: 15 },
      { warehouseId: "warehouse_1", id: "FB006", name: "ເຈ້ຍ POS", unit: "ກໍ້", price: 0, stock: 110, minStock: 30 },
      
      { warehouseId: "warehouse_2", id: "FB003", name: "ກໍ້ເຈ້ຍບີນ", unit: "ກໍ້", price: 0, stock: 980, minStock: 100 },
      { warehouseId: "warehouse_2", id: "FB004", name: "ກໍ້ເຈ້ຍ QR CODE", unit: "ກໍ້", price: 0, stock: 100, minStock: 20 }
    ]);
  }
}

export default async (req: Request) => {
  // Ensure database has seed data if it's completely empty
  try {
    await seedDatabaseIfEmpty();
  } catch (err) {
    console.error("Database seeding/initial check failed:", err);
  }

  if (req.method === "GET") {
    try {
      const allWarehouses = await db.select().from(warehouses);
      const allTransactions = await db.select().from(transactions);
      const allUsers = await db.select().from(users);
      const allProducts = await db.select().from(products);

      const cloudData: Record<string, any> = {
        Warehouses: allWarehouses.map(w => ({
          id: w.id,
          name: w.name,
          location: w.location,
          isMain: w.isMain,
          createdAt: w.createdAt,
        })),
        Transactions: allTransactions.map(t => ({
          id: t.id,
          warehouseId: t.warehouseId,
          productId: t.productId,
          type: t.type,
          quantity: t.quantity,
          note: t.note,
          timestamp: t.timestamp,
        })),
        Users: allUsers.map(u => ({
          username: u.username,
          password: u.password,
          role: u.role,
          fullname: u.fullname,
          createdAt: u.createdAt,
        })),
      };

      allProducts.forEach(p => {
        const sheetName = `Products_${p.warehouseId}`;
        if (!cloudData[sheetName]) {
          cloudData[sheetName] = [];
        }
        cloudData[sheetName].push({
          id: p.id,
          name: p.name,
          unit: p.unit,
          price: p.price,
          stock: p.stock,
          minStock: p.minStock,
        });
      });

      return Response.json(cloudData);
    } catch (err: any) {
      console.error("GET handler failed:", err);
      return Response.json({ error: err.message }, { status: 500 });
    }
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { sheetName, data } = body;

      if (!sheetName || !Array.isArray(data)) {
        return Response.json({ error: "Invalid body structure" }, { status: 400 });
      }

      if (sheetName === "Warehouses") {
        const ids = data.map((w: any) => w.id);
        if (ids.length > 0) {
          await db.delete(warehouses).where(notInArray(warehouses.id, ids));
        } else {
          await db.delete(warehouses);
        }
        for (const item of data) {
          await db.insert(warehouses).values({
            id: item.id,
            name: item.name,
            location: item.location || "ບໍ່ມີຂໍ້ມູນ",
            isMain: !!item.isMain,
            createdAt: item.createdAt || new Date().toISOString(),
          }).onConflictDoUpdate({
            target: warehouses.id,
            set: {
              name: item.name,
              location: item.location || "ບໍ່ມີຂໍ້ມູນ",
              isMain: !!item.isMain,
              createdAt: item.createdAt || new Date().toISOString(),
            }
          });
        }
      } else if (sheetName === "Users") {
        const usernames = data.map((u: any) => u.username);
        if (usernames.length > 0) {
          await db.delete(users).where(notInArray(users.username, usernames));
        } else {
          await db.delete(users);
        }
        for (const u of data) {
          await db.insert(users).values({
            username: u.username,
            password: u.password,
            role: u.role,
            fullname: u.fullname || "",
            createdAt: u.createdAt || new Date().toISOString(),
          }).onConflictDoUpdate({
            target: users.username,
            set: {
              password: u.password,
              role: u.role,
              fullname: u.fullname || "",
              createdAt: u.createdAt || new Date().toISOString(),
            }
          });
        }
      } else if (sheetName === "Transactions") {
        const ids = data.map((t: any) => t.id);
        if (ids.length > 0) {
          await db.delete(transactions).where(notInArray(transactions.id, ids));
        } else {
          await db.delete(transactions);
        }
        for (const t of data) {
          await db.insert(transactions).values({
            id: t.id,
            warehouseId: t.warehouseId,
            productId: t.productId,
            type: t.type,
            quantity: t.quantity,
            note: t.note || "",
            timestamp: t.timestamp,
          }).onConflictDoUpdate({
            target: transactions.id,
            set: {
              warehouseId: t.warehouseId,
              productId: t.productId,
              type: t.type,
              quantity: t.quantity,
              note: t.note || "",
              timestamp: t.timestamp,
            }
          });
        }
      } else if (sheetName.startsWith("Products_")) {
        const warehouseId = sheetName.replace("Products_", "");
        const productIds = data.map((p: any) => p.id);
        if (productIds.length > 0) {
          await db.delete(products).where(and(eq(products.warehouseId, warehouseId), notInArray(products.id, productIds)));
        } else {
          await db.delete(products).where(eq(products.warehouseId, warehouseId));
        }
        for (const p of data) {
          await db.insert(products).values({
            warehouseId: warehouseId,
            id: p.id,
            name: p.name,
            unit: p.unit,
            price: p.price || 0,
            stock: p.stock || 0,
            minStock: p.minStock || 10,
          }).onConflictDoUpdate({
            target: [products.warehouseId, products.id],
            set: {
              name: p.name,
              unit: p.unit,
              price: p.price || 0,
              stock: p.stock || 0,
              minStock: p.minStock || 10,
            }
          });
        }
      } else {
        return Response.json({ error: `Unknown sheetName: ${sheetName}` }, { status: 400 });
      }

      return Response.json({ success: true });
    } catch (err: any) {
      console.error("POST handler failed:", err);
      return Response.json({ error: err.message }, { status: 500 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/sync",
};
