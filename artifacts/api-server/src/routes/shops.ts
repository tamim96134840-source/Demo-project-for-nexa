import { Router, type IRouter } from "express";
import { db, shopsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ListShopsQueryParams, GetShopParams } from "@workspace/api-zod";

const router: IRouter = Router();

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.get("/shops", async (req, res): Promise<void> => {
  const parsed = ListShopsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { lat, lng, radius = 3 } = parsed.data;

  const all = await db.select().from(shopsTable);
  const nearby = all
    .map((shop) => {
      const dist = haversineKm(Number(lat), Number(lng), shop.lat, shop.lng);
      const etaMin = Math.round((dist / 30) * 60);
      return { ...shop, distance: Math.round(dist * 10) / 10, eta: etaMin };
    })
    .filter((s) => s.distance <= Number(radius))
    .sort((a, b) => a.distance - b.distance);

  res.json(nearby);
});

router.get("/shops/:id", async (req, res): Promise<void> => {
  const params = GetShopParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.id, params.data.id));
  if (!shop) {
    res.status(404).json({ error: "Shop not found" });
    return;
  }
  res.json({ ...shop, distance: 0, eta: 5 });
});

export default router;
