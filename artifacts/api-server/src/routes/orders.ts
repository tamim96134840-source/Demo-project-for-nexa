import { Router, type IRouter } from "express";
import { db, ordersTable, shopsTable, usersTable, ridersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { CreateOrderBody, UpdateOrderStatusBody, UpdateOrderStatusParams, GetOrderParams } from "@workspace/api-zod";
import type { Server as IOServer } from "socket.io";

let io: IOServer | null = null;

export function setSocketIO(socketIO: IOServer) {
  io = socketIO;
}

const router: IRouter = Router();

router.post("/orders", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { shopId, customerLat, customerLng, items } = parsed.data;
  const customerId = req.user!.userId;

  const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.id, shopId));
  if (!shop) {
    res.status(400).json({ error: "Shop not found" });
    return;
  }

  const availableRiders = await db
    .select({ rider: ridersTable, user: usersTable })
    .from(ridersTable)
    .innerJoin(usersTable, eq(ridersTable.userId, usersTable.id))
    .where(eq(ridersTable.isAvailable, true));

  const [order] = await db
    .insert(ordersTable)
    .values({
      customerId,
      shopId,
      customerLat,
      customerLng,
      items: items ?? "Standard order",
      status: "preparing",
      riderId: availableRiders.length > 0 ? availableRiders[0].rider.id : null,
    })
    .returning();

  let assignedRiderName: string | null = null;
  if (availableRiders.length > 0) {
    const rider = availableRiders[0];
    assignedRiderName = rider.user.name;
    await db
      .update(ridersTable)
      .set({ isAvailable: false, currentOrderId: order.id })
      .where(eq(ridersTable.id, rider.rider.id));

    if (io) {
      io.to(`rider-${rider.rider.id}`).emit("new-order", {
        orderId: order.id,
        shopLat: shop.lat,
        shopLng: shop.lng,
        customerLat,
        customerLng,
      });
    }
  }

  if (io) {
    io.to(`order-${order.id}`).emit("order-update", { status: "preparing", orderId: order.id });
  }

  res.status(201).json({
    ...order,
    shopName: shop.name,
    riderName: assignedRiderName,
    createdAt: order.createdAt.toISOString(),
  });
});

router.get("/orders", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user!.userId;
  const role = req.user!.role;

  let orders;
  if (role === "customer") {
    orders = await db.select().from(ordersTable).where(eq(ordersTable.customerId, userId));
  } else {
    const [rider] = await db.select().from(ridersTable).where(eq(ridersTable.userId, userId));
    if (!rider) { res.json([]); return; }
    orders = await db.select().from(ordersTable).where(eq(ordersTable.riderId, rider.id));
  }

  const enriched = await Promise.all(orders.map(async (o) => {
    const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.id, o.shopId));
    let riderName: string | null = null;
    if (o.riderId) {
      const [r] = await db.select({ user: usersTable }).from(ridersTable)
        .innerJoin(usersTable, eq(ridersTable.userId, usersTable.id))
        .where(eq(ridersTable.id, o.riderId));
      riderName = r?.user?.name ?? null;
    }
    return { ...o, shopName: shop?.name ?? "Unknown", riderName, createdAt: o.createdAt.toISOString() };
  }));

  res.json(enriched);
});

router.get("/orders/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.id, order.shopId));
  let riderName: string | null = null;
  if (order.riderId) {
    const [r] = await db.select({ user: usersTable }).from(ridersTable)
      .innerJoin(usersTable, eq(ridersTable.userId, usersTable.id))
      .where(eq(ridersTable.id, order.riderId));
    riderName = r?.user?.name ?? null;
  }
  res.json({ ...order, shopName: shop?.name ?? "Unknown", riderName, createdAt: order.createdAt.toISOString() });
});

router.patch("/orders/:id/status", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({ status: parsed.data.status })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (parsed.data.status === "delivered" && order.riderId) {
    await db.update(ridersTable)
      .set({ isAvailable: true, currentOrderId: null })
      .where(eq(ridersTable.id, order.riderId));
  }

  if (io) {
    io.to(`order-${order.id}`).emit("order-update", { status: order.status, orderId: order.id });
  }

  const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.id, order.shopId));
  res.json({ ...order, shopName: shop?.name ?? "Unknown", riderName: null, createdAt: order.createdAt.toISOString() });
});

export default router;
