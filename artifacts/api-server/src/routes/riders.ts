import { Router, type IRouter } from "express";
import { db, ridersTable, usersTable, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { ListAvailableRidersQueryParams, UpdateRiderLocationBody } from "@workspace/api-zod";
import type { Server as IOServer } from "socket.io";

let io: IOServer | null = null;
export function setSocketIO(socketIO: IOServer) {
  io = socketIO;
}

const router: IRouter = Router();

router.get("/riders/available", async (req, res): Promise<void> => {
  const parsed = ListAvailableRidersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const riders = await db
    .select({ rider: ridersTable, user: usersTable })
    .from(ridersTable)
    .innerJoin(usersTable, eq(ridersTable.userId, usersTable.id))
    .where(eq(ridersTable.isAvailable, true));

  res.json(riders.map((r) => ({
    id: r.rider.id,
    name: r.user.name,
    lat: r.rider.lat,
    lng: r.rider.lng,
    isAvailable: r.rider.isAvailable,
  })));
});

router.post("/riders/location", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = UpdateRiderLocationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { lat, lng, orderId } = parsed.data;
  const userId = req.user!.userId;

  const [rider] = await db
    .update(ridersTable)
    .set({ lat, lng })
    .where(eq(ridersTable.userId, userId))
    .returning();

  if (!rider) {
    res.status(404).json({ error: "Rider not found" });
    return;
  }

  if (io && orderId) {
    io.to(`order-${orderId}`).emit("rider-location", {
      lat,
      lng,
      orderId,
      riderId: rider.id,
    });
  }

  res.json({
    id: rider.id,
    name: req.user!.name,
    lat: rider.lat,
    lng: rider.lng,
    isAvailable: rider.isAvailable,
  });
});

export default router;
