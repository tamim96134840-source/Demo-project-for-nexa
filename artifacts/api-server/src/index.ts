import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";
import { verifyToken } from "./lib/auth";
import { setSocketIO as setOrdersIO } from "./routes/orders";
import { setSocketIO as setRidersIO } from "./routes/riders";
import { db, ridersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required but was not provided.");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  path: "/api/socket.io",
});

setOrdersIO(io);
setRidersIO(io);

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) { next(new Error("No token")); return; }
  try {
    const user = verifyToken(token);
    (socket as any).user = user;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", async (socket) => {
  const user = (socket as any).user;
  if (!user) return;

  logger.info({ userId: user.userId, role: user.role }, "Socket connected");

  if (user.role === "rider") {
    const [rider] = await db.select().from(ridersTable).where(eq(ridersTable.userId, user.userId));
    if (rider) {
      socket.join(`rider-${rider.id}`);
      logger.info({ riderId: rider.id }, "Rider joined socket room");
    }
  }

  socket.on("join-order", (orderId: number) => {
    socket.join(`order-${orderId}`);
    logger.info({ orderId, userId: user.userId }, "Joined order room");
  });

  socket.on("leave-order", (orderId: number) => {
    socket.leave(`order-${orderId}`);
  });

  socket.on("rider-location-update", async (data: { lat: number; lng: number; orderId?: number }) => {
    if (user.role !== "rider") return;
    const [rider] = await db.select().from(ridersTable).where(eq(ridersTable.userId, user.userId));
    if (rider) {
      await db.update(ridersTable).set({ lat: data.lat, lng: data.lng }).where(eq(ridersTable.id, rider.id));
      if (data.orderId) {
        io.to(`order-${data.orderId}`).emit("rider-location", {
          lat: data.lat,
          lng: data.lng,
          orderId: data.orderId,
          riderId: rider.id,
        });
      }
    }
  });

  socket.on("disconnect", () => {
    logger.info({ userId: user.userId }, "Socket disconnected");
  });
});

httpServer.listen(port, (err?: Error) => {
  if (err) { logger.error({ err }, "Error listening on port"); process.exit(1); }
  logger.info({ port }, "Nexamove server listening");
});
