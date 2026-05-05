import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import { db, usersTable, ridersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth, type AuthRequest } from "../lib/auth";
import { RegisterUserBody, LoginUserBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, email, password, role } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ name, email, passwordHash, role }).returning();

  if (role === "rider") {
    await db.insert(ridersTable).values({
      userId: user.id,
      lat: 24.540340 + (Math.random() - 0.5) * 0.02,
      lng: 92.588568 + (Math.random() - 0.5) * 0.02,
      isAvailable: true,
    });
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role, name: user.name });
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role, name: user.name });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.get("/auth/me", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const user = req.user!;
  res.json({ id: user.userId, name: user.name, email: user.email, role: user.role });
});

export default router;
